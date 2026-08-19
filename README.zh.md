# DSH Model Extensions

[English](README.md) | 简体中文

面向 DeepSeek Harness Models 设置页的两个可移植扩展：思考强度和模型输入能力。Release 套件包含插件本体及固定版本的宿主适配包，可安装到对应版本的官方 DSH Web。DSH UO 已通过现有内置实现提供同等功能，本仓库不会改变桌面应用的构建或启动方式。

本项目为非官方扩展，与 DeepSeek 无隶属关系。项目与上游 Harness 均处于预览阶段，插件只支持下表列出的固定版本。

## 兼容性

| 项目 | 支持范围 |
| --- | --- |
| DSH | `@deepseek-ai/dsh 0.1.0-rc.5` |
| Harness 源码 | `47f943859bef60e4160492346772ded9b24f765a` |
| Node.js | `^22.19.0 || >=24.0.0` |
| Profile | `web` |
| 官方 DSH Web | 支持思考强度与模型输入能力 |
| DSH UO | 已内置同等功能，请勿把这些独立套件安装到它的 `dsh-home` |

## 便捷安装

安装两个扩展及其宿主适配包。

Windows PowerShell：

```powershell
irm https://raw.githubusercontent.com/KaffuAlcaid/dsh-model-extensions/main/install.ps1 | iex
```

Linux：

```bash
curl -fsSL https://raw.githubusercontent.com/KaffuAlcaid/dsh-model-extensions/main/install.sh | bash
```

安装器下载最新正式 Release，把 tarball 保存到 `$DSH_HOME/plugin-cache`，再通过 PATH 中已安装的兼容版 `dsh` 加入 `web` profile。安装完成后启动：

```powershell
dsh web
```

进入 Models 设置并展开一个模型后，应能看到输入能力和思考强度区域。安装、启动与卸载必须使用同一个 `DSH_HOME`。

## 单独安装

在 [Releases](https://github.com/KaffuAlcaid/dsh-model-extensions/releases) 下载并解压对应文件：

| 文件 | 内容 |
| --- | --- |
| `DSH-Plugin-Reasoning-Effort.zip` | 思考强度插件、Models 适配包和 pi-ai 适配包 |
| `DSH-Plugin-Model-Input.zip` | 模型输入能力插件和 Models 适配包 |
| `DSH-Model-Extensions.zip` | 两个插件及全部宿主适配包 |

解压后运行 `install.ps1` 或 `install.sh`。各套件 README 提供准确的卸载命令和包清单。

## 功能范围

- 思考强度：提供方预设、自定义档位映射、思考格式以及 Developer/System 提示词角色。
- 模型输入能力：自动、仅文本、文本与图片三种声明方式。
- 配置数据：只写入 Harness 与 pi-ai 已有字段，不保存插件专属预设 ID。

插件通过自己的 `cordis.patch.yml` 加入 profile。Models 和 pi-ai 的适配改动保留为可审查 Patch，Release 则提供已经构建好的 tarball，普通用户无需准备 Harness 源码。详见 [Patch 说明](docs/patches.zh.md)。

## 开发

构建过程会获取固定的官方 Harness 提交、复制两个插件、应用 Patch，并生成三个 ZIP。开发与发布步骤见[构建文档](docs/building.zh.md)。

## 许可证

扩展源码使用 [MIT License](LICENSE)。从 Harness 源码构建的适配包继续保留上游许可证与版权声明。
