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

脚本会在 `.build` 中获取和准备固定 Harness 源码，安装其依赖，构建宿主适配与插件，然后把 ZIP 写入 `release/`。已有 `.build/deepseek-harness` 时准备脚本会停止，避免覆盖正在使用的 worktree。

## 发布文件

标签必须与根 `package.json` 的版本一致，例如 `v0.1.0`。Release 工作流发布三个带版本 ZIP 和三个供一行安装脚本使用的稳定文件名。

升级 Harness 时，先更新 `upstream/harness.json`，再在干净的官方提交上重新整理两个 Patch。不得把 Web bundle 注册、上游 lockfile 或本机路径写入 Patch。
