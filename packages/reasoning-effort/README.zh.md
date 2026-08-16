# @dsh-uo/client-ui-reasoning-effort

[English](README.md) | 中文

DeepSeek Harness 的单模型思考强度客户端插件。插件占用 Models 宿主适配包声明的单实例 `settings.models.model.reasoning` slot，只写入 Harness 与 pi-ai 已有的 `reasoningEfforts`、`compat.thinkingFormat`、`compat.supportsReasoningEffort` 和 `compat.supportsDeveloperRole` 字段。

插件提供 OpenAI GPT、Anthropic Claude、xAI Grok、Kimi、GLM、DeepSeek 手动预设以及自定义映射。插件不会根据模型 ID 猜测预设，Gemini 没有预设或专用适配。

对于 `openai-completions` 和 `openai-responses`，系统提示词角色可以保持 pi-ai 的协议默认行为，也可以显式固定为 `Developer` 或 `System`。该设置只覆盖 pi-ai 的角色选择，不探测端点。

安装套件通过插件自己的 Cordis 组合层启用此插件。移除插件后，思考设置界面会消失，Models 编辑器及其已保存数据校验仍然保留。

## 独立发布

本包同时声明客户端模块和 DSH 组合层，但 Models 页面需要配套宿主适配才能声明插件使用的 slot，系统提示词角色覆盖还需要配套 `llm-pi-ai`。面向用户的 GitHub Release 因此提供包含三者的 `DSH-Plugin-Reasoning-Effort-<version>.zip`，不要只安装本包的 tarball。安装方法见[仓库 README](../../README.zh.md)。

## 退场方式

如果 Harness 日后提供等价功能，先从 profile 移除 `@dsh-uo/client-ui-reasoning-effort`；没有 slot 占用者时，Models 页面仍可正常工作。最后对照上游实现，再决定是否保留 Models 和 pi-ai 宿主 Patch。

用户设置无需迁移：插件只写入 Harness 与 pi-ai 已支持的字段，不写入 DSH-UO 标记或预设 ID。
