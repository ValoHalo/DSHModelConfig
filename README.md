# DSH Model Extensions

English | [简体中文](README.zh.md)

An installable model-capability plugin for stock DeepSeek Harness Web. Once installed, it takes over the existing Models section and adds input and reasoning controls inside each expanded pi-ai model row. Uninstalling restores the stock page. The page implementation and both editors ship in one npm package.

This is an unofficial project with no affiliation with DeepSeek. DSH is preview software; this project supports only the pinned version below.

## Compatibility

| Component | Supported range |
| --- | --- |
| DSH | `@deepseek-ai/dsh 0.1.0-rc.7` |
| Harness source | `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` |
| Node.js | `^22.19.0 || >=24.0.0` |
| Profile | `web` |
| Stock DSH Web | Supported |
| DSH UO | Equivalent functionality is bundled; do not install it again |

## Install

After the package is published to npm, install through the official plugin command:

```powershell
dsh plugin --profile web add dsh-model-config@0.2.0
dsh web
```

Before npm publication, use the GitHub Release installer.

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/ValoHalo/DSHModelConfig/main/install.ps1 | iex
```

Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/ValoHalo/DSHModelConfig/main/install.sh | bash
```

Open Settings → Models, then expand a provider editor and one of its model rows. The controls affect only pi-ai models already declared on that page; providers that still use the stock catalog remain untouched.

Uninstall the npm bundle with:

```powershell
dsh plugin --profile web remove dsh-model-config
```

## Features

- Reasoning effort: manual OpenAI, Anthropic, xAI, Kimi, GLM, and DeepSeek presets, custom effort maps, and thinking request formats.
- Model input: automatic, text-only, and text-and-image declarations.
- Custom-provider model capacities: fetched models adopt consistent same-ID context-window and max-output values from the pinned DSH catalog; missing or ambiguous matches fall back to `262144` and `32768`, while existing manually edited rows remain unchanged.
- Persistence: capability fields join the stock Models form draft and are saved by the same Apply action through the official settings mutation and namespace revision.
- Stored fields: only stock `input`, `reasoningEfforts`, `compat.thinkingFormat`, and `compat.supportsReasoningEffort` fields.

Stock rc.7 does not expose `compat.supportsDeveloperRole`, so the pure plugin does not offer Developer/System prompt-role selection.

## Architecture

`dsh-model-config` is the only published package and user-facing install entry. Its build inlines the Models page from the pinned Harness commit and adds a model-row child slot. At runtime, the plugin registers that page in the existing `models` cell at a lower priority and contributes both editors through the child slot. Installation does not modify global DSH files; uninstalling exposes the stock Models entry again.

## Development and release

The build fetches a pinned stock Harness commit, copies the single extension package into its client workspace, uses the official client bundle preset, and produces one Release ZIP. See [Building and Releasing](docs/building.md).

## License

Extension source is distributed under the [MIT License](LICENSE). The release bundle also includes code derived from DeepSeek Harness; see [Third-Party Notices](THIRD_PARTY_NOTICES.md).
