#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const preparedRoot = join(projectRoot, '.build', 'deepseek-harness')
const tarballRoot = join(projectRoot, '.build', 'tarballs')
const outputRoot = join(projectRoot, 'release', 'plugin-kits')
const config = JSON.parse(readFileSync(join(projectRoot, 'plugin-project.json'), 'utf8'))

function run(command, args, cwd = projectRoot, env = process.env) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32' && command === 'corepack',
  })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${String(result.status)}`)
}

if (!existsSync(join(preparedRoot, 'package.json'))) {
  run(process.execPath, [join(projectRoot, 'scripts', 'prepare-harness.mjs')])
} else {
  run(process.execPath, [join(projectRoot, 'scripts', 'prepare-harness.mjs'), '--refresh'])
}

run('corepack', [
  'pnpm',
  'install',
  '--no-frozen-lockfile',
  '--fetch-retries=5',
  '--fetch-timeout=3600000',
], preparedRoot, { ...process.env, CI: process.env.CI ?? '1' })
run(process.execPath, [
  join(projectRoot, 'scripts', 'generate-model-capacity-defaults.mjs'),
  '--harness',
  preparedRoot,
  '--output',
  join(preparedRoot, 'packages', 'client', 'ui-dsh-model-config', 'src', 'client', 'model-capacity-defaults.ts'),
])
run('corepack', ['pnpm', 'run', 'build:lib:host'], preparedRoot)
for (const item of config.packagesToCopy) {
  run('corepack', ['pnpm', 'exec', 'tsc', '-b', join(item.target, 'tsconfig.json')], preparedRoot)
}
run('corepack', ['pnpm', 'run', 'build:lib:client'], preparedRoot)
for (const item of config.packagesToCopy) {
  run('corepack', ['pnpm', '--filter', item.name, 'run', 'bundle'], preparedRoot)
}

const testDirectories = []
for (const item of config.packagesToCopy) {
  const source = join(projectRoot, item.source, 'tests')
  if (!existsSync(source)) continue
  const target = join(preparedRoot, item.target, 'tests')
  rmSync(target, { recursive: true, force: true })
  cpSync(source, target, { recursive: true, errorOnExist: true })
  testDirectories.push(join(item.target, 'tests'))
}
if (testDirectories.length > 0) {
  run('corepack', ['pnpm', 'exec', 'vitest', 'run', ...testDirectories], preparedRoot)
}

rmSync(tarballRoot, { recursive: true, force: true })
mkdirSync(tarballRoot, { recursive: true })
const filters = config.buildPackages.flatMap(item => ['--filter', item.name])
run('corepack', [
  'pnpm',
  ...filters,
  'pack',
  '--pack-destination',
  tarballRoot,
], preparedRoot)
run(process.execPath, [
  join(projectRoot, 'scripts', 'package-plugin-kits.mjs'),
  '--harness', preparedRoot,
  '--tarballs', tarballRoot,
  '--output', outputRoot,
])
