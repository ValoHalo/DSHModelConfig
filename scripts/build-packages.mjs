#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const preparedRoot = join(projectRoot, '.build', 'deepseek-harness')
const tarballRoot = join(projectRoot, '.build', 'tarballs')
const outputRoot = join(projectRoot, 'release', 'plugin-kits')
const config = JSON.parse(readFileSync(join(projectRoot, 'plugin-project.json'), 'utf8'))

function run(command, args, cwd = projectRoot) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${String(result.status)}`)
}

if (!existsSync(join(preparedRoot, 'package.json'))) {
  run(process.execPath, [join(projectRoot, 'scripts', 'prepare-harness.mjs')])
}

run('corepack', ['pnpm', 'install', '--no-frozen-lockfile'], preparedRoot)
run('corepack', ['pnpm', 'run', 'build:lib'], preparedRoot)
for (const item of config.packagesToCopy) {
  run('corepack', ['pnpm', 'exec', 'tsc', '-b', join(item.target, 'tsconfig.json')], preparedRoot)
  run('corepack', ['pnpm', '--filter', item.name, 'run', 'bundle'], preparedRoot)
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
