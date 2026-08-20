# 构建与发布

[English](building.md) | 简体中文

本页供维护者使用。普通用户应直接使用仓库 README 中的 Release 安装方式。

## 环境

- Git；
- `Node.js ^22.19.0 || >=24.0.0`；
- Corepack 与 `pnpm 11.7.0`；
- Linux 打包需要 `zip`。

## 本地打包

Windows：

```powershell
corepack enable
corepack pnpm run package:win
```

Linux：

```bash
corepack enable
corepack pnpm run package:linux
```

脚本会在 `.build` 中获取固定 Harness 源码，每次构建都刷新复制进去的插件包和该提交的 Models 页面源码，应用模型行 slot patch，安装依赖，从该版本的 pi-ai catalog 生成同 ID 模型容量索引，编译并测试插件，再使用官方客户端 bundle preset 构建，最后把 ZIP 写入 `release/`。固定的上游 worktree 会在多次构建之间保留，只替换生成的插件目标目录。

## 发布文件

标签必须与根 `package.json` 的版本一致，例如 `v0.2.0`。Release 工作流发布一个带版本 ZIP 和一个供一行安装脚本使用的稳定文件名。

升级 Harness 时，更新 `upstream/harness.json`，然后重新核对并更新 `patches/0001-inline-model-capability-slot.patch`，同时检查 `llm-pi-ai` 模型字段、Settings slot、settings mutation 和客户端 bundle preset。patch 只作用于构建目录中内联到插件 bundle 的源码，不修改用户安装的全局 DSH 文件。

## npm 发布

构建后的单个 tarball 位于 `.build/tarballs`，发布目标是 `dsh-model-config`。

仓库外还需要在 npm 完成以下设置：

1. 确认 `oceanscope` 账号邮箱已验证并启用双重验证。
2. 首次发布可选择两种方式：执行 `npm login` 后手动发布经 CI 验证的 tarball；或创建可新建该包的短期 granular token，在推送发布 tag 前保存为 GitHub Actions secret `NPM_TOKEN`。Release 工作流会附带 provenance 发布。
3. 包创建后，在 npm 的 package settings 中添加 GitHub Actions Trusted Publisher：GitHub owner 填 `ValoHalo`，repository 填 `DSHModelConfig`，workflow 填 `release.yml`，environment 填 `npm-publish`。
4. Trusted Publisher 生效后删除临时 `NPM_TOKEN` secret；后续版本使用 OIDC，不再需要仓库 token。

CI 会把构建后的 tarball 和 ZIP 保存为保留七天的 workflow artifact。手动首次发布时，解压该 artifact 后直接发布 tarball：

```bash
npm publish .build/tarballs/dsh-model-config-0.2.0.tgz --access public
```
