# @dsh-uo/client-ui-model-input

[English](README.md) | 中文

DeepSeek Harness 的单模型输入能力客户端插件。插件占用 Models 宿主适配包声明的单实例 `settings.models.model.input` slot，只写入 Harness 已有的模型 `input` 字段。

三个模式分别是自动、仅文本（`[text]`）和文本与图片（`[text, image]`）。自动模式跟随同一模型已经选择的思考映射预设：OpenAI GPT、Anthropic Claude、xAI Grok、Kimi 使用文本与图片，GLM、DeepSeek 使用仅文本。切换预设时，仍处于自动模式的输入能力会同步更新；用户主动选择另一个输入模式后停止跟随。

自定义思考映射或没有选择预设时，自动模式删除 `input`，继续使用 Harness 的内置模型目录、提供方 `defaultInput` 和最终仅文本回退。插件不会根据提供商或模型 ID 猜测能力，也不会探测上游接口。遇到未来版本新增的未知模态时，插件会保留原配置，直到用户主动选择其他模式。

安装套件通过插件自己的 Cordis 组合层启用此插件。移除插件后，输入能力界面会消失，Harness 仍会继续识别已经保存的 `input`。

## 独立发布

本包同时声明客户端模块和 DSH 组合层，但 Models 页面需要配套宿主适配才能声明插件使用的 slot。面向用户的 GitHub Release 因此提供包含两者的 `DSH-Plugin-Model-Input-<version>.zip`，不要只安装本包的 tarball。安装方法见[仓库 README](../../README.zh.md)。

## 退场方式

如果 Harness 日后提供等价功能，先从 profile 移除 `@dsh-uo/client-ui-model-input`；没有 slot 占用者时，Models 页面仍可正常工作。最后对照上游实现，再决定是否保留 Models 宿主 Patch。

用户设置无需迁移，因为插件只写入 Harness 已有的 `input` 字段。
