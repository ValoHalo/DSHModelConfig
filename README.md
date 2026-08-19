# DSH Model Extensions

English | [简体中文](README.zh.md)

Two portable extensions for the DeepSeek Harness Models settings page: reasoning effort and model input capabilities. Release kits contain each plugin and its pinned host adapters for the matching stock DSH Web version. DSH UO already contains equivalent features through its existing bundled implementation; this repository does not change the desktop application's build or startup path.

This is an unofficial project with no affiliation with DeepSeek. Both this project and upstream Harness are preview software; only the pinned version below is supported.

## Compatibility

| Component | Supported range |
| --- | --- |
| DSH | `@deepseek-ai/dsh 0.1.0-rc.5` |
| Harness source | `47f943859bef60e4160492346772ded9b24f765a` |
| Node.js | `^22.19.0 || >=24.0.0` |
| Profile | `web` |
| Stock DSH Web | Reasoning effort and model input are supported |
| DSH UO | Equivalent features are already included; do not install these standalone kits into its `dsh-home` |

## Quick Install

Install both extensions and their host adapters.

Windows PowerShell:

```powershell
irm https://raw.githubusercontent.com/KaffuAlcaid/dsh-model-extensions/main/install.ps1 | iex
```

Linux:

```bash
curl -fsSL https://raw.githubusercontent.com/KaffuAlcaid/dsh-model-extensions/main/install.sh | bash
```

The bootstrap downloads the latest formal Release, retains tarballs under `$DSH_HOME/plugin-cache`, and uses the compatible `dsh` already available on PATH to add them to the `web` profile. Launch it afterwards:

```powershell
dsh web
```

Expand a model in Models settings. Input Capability and Reasoning Effort sections should be present. Installation, launch, and removal must use the same `DSH_HOME`.

## Individual Kits

Download and extract the required file from [Releases](https://github.com/KaffuAlcaid/dsh-model-extensions/releases):

| File | Contents |
| --- | --- |
| `DSH-Plugin-Reasoning-Effort.zip` | Reasoning plugin, Models adapter, and pi-ai adapter |
| `DSH-Plugin-Model-Input.zip` | Model-input plugin and Models adapter |
| `DSH-Model-Extensions.zip` | Both plugins and every host adapter |

Run `install.ps1` or `install.sh` from the extracted kit. Each kit README contains its exact removal commands and package inventory.

## Scope

- Reasoning Effort: provider presets, custom effort maps, thinking format, and Developer/System prompt roles.
- Model Input: automatic, text-only, and text-and-image declarations.
- Stored configuration: existing Harness and pi-ai fields only; no plugin-specific preset identifiers.

Each plugin supplies its own `cordis.patch.yml` profile layer. Models and pi-ai adaptations remain reviewable source patches, while Releases contain built tarballs so ordinary users do not need a Harness checkout. See [Patch Design](docs/patches.md).

## Development

The build fetches the pinned official Harness commit, copies both plugins, applies the patches, and produces three ZIP files. See [Building and Releasing](docs/building.md).

## License

Extension source is distributed under the [MIT License](LICENSE). Adapter packages built from Harness retain upstream licenses and notices.
