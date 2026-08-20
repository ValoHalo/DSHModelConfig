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

The scripts fetch the pinned Harness source under `.build`, refresh the copied plugin package and that commit's Models page source on every build, apply the model-row slot patch, install dependencies, generate the same-ID model-capacity index from that pi-ai catalog, compile and test the plugin, build with the official client bundle preset, and write a ZIP under `release/`. The pinned upstream worktree is retained between builds; only the generated plugin target is replaced.

## Release Files

The tag must match the root `package.json` version, for example `v0.2.0`. The Release workflow publishes one versioned ZIP and one stable filename used by the one-line installers.

When upgrading Harness, update `upstream/harness.json`, refresh `patches/0001-inline-model-capability-slot.patch`, and review the `llm-pi-ai` model fields, Settings slots, settings mutation API, and client bundle preset. The patch applies only to source in the build directory that is inlined into the plugin bundle; it does not modify the user's global DSH installation.

## npm publication

The single built tarball is under `.build/tarballs`, and its publication target is `dsh-model-config`.

The following setup remains outside this repository:

1. Verify the `oceanscope` account email and enable two-factor authentication.
2. For the first publication, either run `npm login` and publish the CI-verified tarball manually, or create a short-lived granular token that can create the package and store it as the GitHub Actions secret `NPM_TOKEN` before pushing the release tag. The Release workflow publishes with provenance.
3. After the package exists, add a GitHub Actions Trusted Publisher in its npm package settings: use GitHub owner `ValoHalo`, repository `DSHModelConfig`, workflow `release.yml`, and environment `npm-publish`.
4. Delete the temporary `NPM_TOKEN` secret after Trusted Publishing is active. Later releases use OIDC and do not need a repository token.

CI uploads the built tarball and ZIP as a seven-day workflow artifact. A manual first publication can publish the extracted tarball directly:

```bash
npm publish .build/tarballs/dsh-model-config-0.2.0.tgz --access public
```
