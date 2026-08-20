# DSH Model Extensions

[English](README.md) | 简体中文

面向官方 DeepSeek Harness Web 的可安装模型能力插件。安装后由插件接管 Settings 中现有的“模型”页面，在每个 pi-ai 模型的展开区域加入输入能力和思考强度控件；卸载后自动恢复官方页面。页面实现和两个编辑器全部由同一个 npm 包提供。

本项目为非官方扩展，与 DeepSeek 无隶属关系。DSH 仍处于预览阶段，本项目只支持下表指定的版本。

## 兼容性

| 项目 | 支持范围 |
| --- | --- |
| DSH | `@deepseek-ai/dsh 0.1.0-rc.7` |
| Harness 源码 | `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` |
| Node.js | `^22.19.0 || >=24.0.0` |
| Profile | `web` |
| 官方 DSH Web | 支持 |
| DSH UO | 已内置同等功能，请勿重复安装 |

## 安装

发布到 npm 后，使用官方插件命令安装：

```powershell
dsh plugin --profile web add dsh-model-config@0.2.0
dsh web
```

在 npm 包发布前，可使用 GitHub Release 安装器：

Windows PowerShell：

```powershell
irm https://raw.githubusercontent.com/ValoHalo/DSHModelConfig/main/install.ps1 | iex
```

Linux：

```bash
curl -fsSL https://raw.githubusercontent.com/ValoHalo/DSHModelConfig/main/install.sh | bash
```

进入 Settings → Models，展开提供方编辑卡片和其中的模型行即可设置模型能力。控件只作用于页面中已经声明的 pi-ai 模型；未声明模型的提供方继续使用官方 catalog，不会由插件猜测或具化。

卸载 npm 包：

```powershell
dsh plugin --profile web remove dsh-model-config
```

## 功能

- 思考强度：OpenAI、Anthropic、xAI、Kimi、GLM、DeepSeek 手动预设，以及自定义档位映射和思考请求格式。
- 输入能力：自动、仅文本、文本与图片三种声明方式。
- 自定义提供方模型容量：获取模型时按 ID 采用固定 DSH catalog 中一致的上下文窗口和最大输出；接口未提供且无法唯一匹配时使用 `262144` 和 `32768`，已存在模型行中的手动值保持不变。
- 保存方式：能力字段进入官方 Models 表单的当前 draft，并由同一个“应用”操作通过官方 settings mutation 和 namespace revision 保存。
- 配置数据：只写入官方已有的 `input`、`reasoningEfforts`、`compat.thinkingFormat` 和 `compat.supportsReasoningEffort` 字段。

官方 rc.7 尚未开放 `compat.supportsDeveloperRole`，因此纯插件版不提供 Developer/System 系统提示词角色切换。

## 架构

`dsh-model-config` 是唯一的发布包和用户安装入口。构建时会从固定 Harness 提交内联 Models 页面源码，并加入模型行子 slot；运行时插件以较低 priority 接管同一个 `models` 设置项，通过子 slot 渲染两个编辑器。安装不会修改全局 DSH 文件，卸载插件后官方 Models 页面重新成为有效项。

## 开发与发布

构建流程获取固定的官方 Harness 提交，把单个扩展包复制进其 client workspace，使用官方客户端 bundle preset 构建并生成一个 Release ZIP。开发与发布步骤见[构建文档](docs/building.zh.md)。

## 许可证

扩展源码使用 [MIT License](LICENSE)。发布包还包含从 DeepSeek Harness 派生的代码，详见[第三方声明](THIRD_PARTY_NOTICES.md)。
