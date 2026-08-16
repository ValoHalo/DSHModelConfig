# Building and Releasing

English | [简体中文](building.zh.md)

This page is for maintainers. Ordinary users should install a Release through the repository README.

## Requirements

- Git;
- `Node.js ^22.19.0 || >=24.0.0`;
- Corepack and `pnpm 11.7.0`;
- `zip` for Linux packaging.

## Local Packaging

Windows:

```powershell
corepack enable
corepack pnpm run package:win
```

Linux:

```bash
corepack enable
corepack pnpm run package:linux
```

The scripts fetch and prepare the pinned Harness source under `.build`, install its dependencies, build adapters and plugins, and write ZIP files under `release/`. Preparation stops when `.build/deepseek-harness` already exists so an active worktree is not overwritten.

## Release Files

The tag must match the root `package.json` version, for example `v0.1.0`. The Release workflow publishes three versioned ZIPs and three stable filenames used by the one-line installers.

When upgrading Harness, update `upstream/harness.json` and regenerate both patches against a clean official commit. Keep Web bundle registration, the upstream lockfile, and local-machine paths out of the patches.
