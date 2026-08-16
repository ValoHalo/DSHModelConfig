#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const config = JSON.parse(readFileSync(join(projectRoot, 'plugin-project.json'), 'utf8'))
const harness = JSON.parse(readFileSync(join(projectRoot, 'upstream', 'harness.json'), 'utf8'))

function run(command, args, cwd = projectRoot) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) throw new Error(`${command} failed with exit code ${String(result.status)}`)
}

if (!Array.isArray(config.packagesToCopy) || !Array.isArray(config.patches)) {
  throw new Error('plugin-project.json must declare packagesToCopy and patches arrays')
}
if (typeof harness.repository !== 'string' || !/^[0-9a-fA-F]{40}$/.test(harness.commit)) {
  throw new Error('upstream/harness.json must declare a repository and full commit SHA')
}

const { values } = parseArgs({
  options: {
    upstream: { type: 'string' },
    output: { type: 'string' },
  },
  allowPositionals: false,
})

const upstreamRoot = resolve(values.upstream ?? join(projectRoot, '.build', 'harness-upstream'))
const preparedRoot = resolve(values.output ?? join(projectRoot, '.build', 'deepseek-harness'))
if (existsSync(preparedRoot)) {
  throw new Error(`prepared Harness path already exists: ${preparedRoot}`)
}

if (!existsSync(join(upstreamRoot, '.git'))) {
  mkdirSync(dirname(upstreamRoot), { recursive: true })
  run('git', ['init', upstreamRoot])
  run('git', ['-C', upstreamRoot, 'remote', 'add', 'origin', harness.repository])
} else {
  run('git', ['-C', upstreamRoot, 'remote', 'set-url', 'origin', harness.repository])
}
run('git', ['-C', upstreamRoot, 'fetch', '--depth=1', 'origin', harness.commit])
mkdirSync(dirname(preparedRoot), { recursive: true })
run('git', ['-C', upstreamRoot, 'worktree', 'add', '--detach', preparedRoot, harness.commit])

for (const item of config.packagesToCopy) {
  const source = join(projectRoot, item.source)
  const target = join(preparedRoot, item.target)
  if (!existsSync(source)) throw new Error(`plugin source was not found: ${source}`)
  cpSync(source, target, { recursive: true, errorOnExist: true })
  // The Harness client aggregate discovers workspace tests before these packages are project references.
  rmSync(join(target, 'tests'), { recursive: true, force: true })
}
for (const relativePatch of config.patches) {
  const patch = join(projectRoot, relativePatch)
  if (!existsSync(patch)) throw new Error(`Harness patch was not found: ${patch}`)
  run('git', ['-C', preparedRoot, 'apply', '--whitespace=nowarn', patch])
}
cpSync(join(projectRoot, 'upstream', 'harness.json'), join(preparedRoot, 'harness.json'))
console.log(`Prepared Harness source: ${preparedRoot}`)
