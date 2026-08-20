#!/usr/bin/env node

import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const templateRoot = join(projectRoot, 'scripts', 'plugin-kit-templates')

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function tarballName(name, version) {
  const stem = name.startsWith('@') ? name.slice(1).replace('/', '-') : name
  return `${stem}-${version}.tgz`
}

const { values } = parseArgs({
  options: {
    harness: { type: 'string' },
    tarballs: { type: 'string' },
    output: { type: 'string' },
  },
  allowPositionals: false,
})
if (values.harness === undefined || values.tarballs === undefined || values.output === undefined) {
  throw new Error('usage: package-plugin-kits.mjs --harness <prepared-harness> --tarballs <packed-workspaces> --output <plugin-kits>')
}

const app = readJson(join(projectRoot, 'package.json'))
const project = readJson(join(projectRoot, 'plugin-project.json'))
const harness = readJson(join(projectRoot, 'upstream', 'harness.json'))
const harnessRoot = resolve(values.harness)
const tarballRoot = resolve(values.tarballs)
const outputRoot = resolve(values.output)
const expectedOutputRoot = join(projectRoot, 'release', 'plugin-kits')
if (outputRoot !== expectedOutputRoot) {
  throw new Error(`refusing to replace unexpected plugin-kit path: ${outputRoot}`)
}
if (typeof app.version !== 'string' || typeof harness.version !== 'string'
  || typeof harness.commit !== 'string' || typeof harness.node !== 'string'
  || typeof harness.packageManager !== 'string') {
  throw new Error('release and Harness manifests are incomplete')
}

const packages = new Map()
for (const item of project.buildPackages) {
  const manifestPath = join(harnessRoot, item.directory, 'package.json')
  if (!existsSync(manifestPath)) throw new Error(`package manifest was not found: ${manifestPath}`)
  const manifest = readJson(manifestPath)
  if (manifest.name !== item.name || typeof manifest.version !== 'string') {
    throw new Error(`package identity does not match plugin-project.json: ${manifestPath}`)
  }
  if (manifest.version !== app.version) {
    throw new Error(`package version ${manifest.version} does not match release version ${app.version}: ${manifestPath}`)
  }
  const file = tarballName(manifest.name, manifest.version)
  const source = join(tarballRoot, file)
  if (!existsSync(source)) throw new Error(`packed package was not found: ${source}`)
  packages.set(item.name, { name: item.name, version: manifest.version, file, source, role: item.role })
}

function commandFor(names) {
  return `dsh plugin --profile web remove ${names.join(' ')}`
}

function launchFor(kit) {
  if (kit.desktopOnlyPlugins.length === kit.plugins.length) return undefined
  return 'dsh web'
}

function kitPackages(kit) {
  return kit.packages.map((name) => {
    const item = packages.get(name)
    if (item === undefined) throw new Error(`kit ${kit.id} names an unknown package: ${name}`)
    return item
  })
}

function readmeZh(kit, selected) {
  const launch = launchFor(kit)
  const desktopNote = kit.desktopOnlyPlugins.length > 0
    ? '\n此套件中的桌面功能依赖兼容 Electron 宿主提供的 `window.dshDesktop`，普通浏览器版 DSH 会隐藏对应入口。\n'
    : ''
  const launchBlock = launch === undefined
    ? '请正常启动兼容 Electron 宿主。宿主必须使用本套件指定的 DSH 版本和安装时的同一个 `DSH_HOME`。'
    : `\`\`\`powershell\n${launch}\n\`\`\``
  const list = selected.map(item => `- \`${item.name}\`：${item.role}`).join('\n')
  const sharedRemoval = kit.shared.length === 0
    ? ''
    : `
确认没有其他相关插件后，再移除组合包直接安装的功能依赖：

\`\`\`powershell
${commandFor(kit.shared)}
\`\`\`
`
  return `# ${kit.titleZh}

${kit.summaryZh}

兼容版本：\`@deepseek-ai/dsh ${harness.version}\`，对应官方提交 \`${harness.commit}\`。请勿安装到其他 DSH 版本。${desktopNote}
## 安装

Windows PowerShell：

\`\`\`powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\\install.ps1
\`\`\`

Linux：

\`\`\`bash
bash ./install.sh
\`\`\`

需要预先安装兼容版本的 DSH，并满足 \`Node.js ${harness.node}\` 与 \`${harness.packageManager}\`。安装器会直接调用 PATH 中的 \`dsh\`，并先把 tarball 复制到 \`$DSH_HOME/plugin-cache\`；安装完成后可以删除解压目录。

当前 DSH UO 已通过现有内置实现提供同等功能。请勿把本独立套件安装到桌面版的 \`dsh-home\`；本仓库不会改变 DSH UO 的构建或启动方式。

## 启动

${launchBlock}

安装、启动和卸载必须使用同一个 \`DSH_HOME\`。已有 profile 如果曾由其他 DSH 版本使用，请改用新的 \`DSH_HOME\`。

## 卸载

移除插件：

\`\`\`powershell
${commandFor(kit.plugins)}
\`\`\`
${sharedRemoval}

## 包内容

${list}

本项目为非官方扩展，与 DeepSeek 无隶属关系。扩展代码按 MIT License 分发；内联的 DeepSeek Harness 源码声明见 THIRD_PARTY_NOTICES.md。
`
}

function readmeEn(kit, selected) {
  const launch = launchFor(kit)
  const desktopNote = kit.desktopOnlyPlugins.length > 0
    ? '\nDesktop-only features in this kit require a compatible Electron host that supplies `window.dshDesktop`; stock browser-hosted DSH hides those entries.\n'
    : ''
  const launchBlock = launch === undefined
    ? 'Start the compatible Electron host normally. It must use this kit\'s DSH version and the same `DSH_HOME` used during installation.'
    : `\`\`\`powershell\n${launch}\n\`\`\``
  const list = selected.map(item => `- \`${item.name}\`: ${item.role}`).join('\n')
  const sharedRemoval = kit.shared.length === 0
    ? ''
    : `
After every related plugin has been removed, remove the feature dependencies installed directly by this kit:

\`\`\`powershell
${commandFor(kit.shared)}
\`\`\`
`
  return `# ${kit.title}

${kit.summary}

Compatible with \`@deepseek-ai/dsh ${harness.version}\` at official commit \`${harness.commit}\`. Do not install it into another DSH version.${desktopNote}
## Install

Windows PowerShell:

\`\`\`powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\\install.ps1
\`\`\`

Linux:

\`\`\`bash
bash ./install.sh
\`\`\`

Requires a compatible DSH installation, \`Node.js ${harness.node}\`, and \`${harness.packageManager}\`. The installer calls \`dsh\` from PATH and copies tarballs into \`$DSH_HOME/plugin-cache\` before installation, so the extracted directory may be deleted afterwards.

Current DSH UO releases already include equivalent features through their existing bundled implementation. Do not install this standalone kit into the desktop application's \`dsh-home\`; this repository does not change the DSH UO build or startup path.

## Launch

${launchBlock}

Installation, launch, and removal must use the same \`DSH_HOME\`. Use a new \`DSH_HOME\` if an existing profile has been used by another DSH version.

## Uninstall

Remove the plugin:

\`\`\`powershell
${commandFor(kit.plugins)}
\`\`\`
${sharedRemoval}

## Contents

${list}

This is an unofficial extension project with no affiliation with DeepSeek. Extension code is distributed under the MIT License; notices for inlined DeepSeek Harness source are in THIRD_PARTY_NOTICES.md.
`
}

rmSync(outputRoot, { recursive: true, force: true })
mkdirSync(outputRoot, { recursive: true })
for (const kit of project.kits) {
  const selected = kitPackages(kit)
  const directory = `${kit.artifact}-${app.version}`
  const kitRoot = join(outputRoot, directory)
  mkdirSync(kitRoot, { recursive: true })
  for (const item of selected) copyFileSync(item.source, join(kitRoot, item.file))
  copyFileSync(join(projectRoot, 'LICENSE'), join(kitRoot, 'LICENSE'))
  copyFileSync(join(projectRoot, 'THIRD_PARTY_NOTICES.md'), join(kitRoot, 'THIRD_PARTY_NOTICES.md'))
  copyFileSync(join(templateRoot, 'install.ps1'), join(kitRoot, 'install.ps1'))
  copyFileSync(join(templateRoot, 'install.sh'), join(kitRoot, 'install.sh'))
  chmodSync(join(kitRoot, 'install.sh'), 0o755)
  writeFileSync(join(kitRoot, 'README.zh.md'), readmeZh(kit, selected))
  writeFileSync(join(kitRoot, 'README.md'), readmeEn(kit, selected))
  writeFileSync(join(kitRoot, 'kit.json'), `${JSON.stringify({
    schemaVersion: 1,
    id: kit.id,
    artifact: kit.artifact,
    title: kit.title,
    titleZh: kit.titleZh,
    version: app.version,
    profile: 'web',
    desktopOnly: kit.desktopOnlyPlugins.length === kit.plugins.length,
    desktopOnlyPlugins: kit.desktopOnlyPlugins,
    dsh: {
      version: harness.version,
      commit: harness.commit,
      node: harness.node,
      packageManager: harness.packageManager,
    },
    packages: selected.map(({ name, version, file, role }) => ({ name, version, file, role })),
    plugins: kit.plugins,
    shared: kit.shared,
  }, null, 2)}\n`)
}
console.log(`Portable plugin kits written to ${outputRoot}`)
