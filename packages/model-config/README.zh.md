# dsh-model-config

[English](README.md) | 中文

适配官方 DSH Web 的单包模型能力插件。它接管现有 `models` 设置项，在 pi-ai 模型行内部声明子 slot，并通过该 slot 提供输入能力与思考强度编辑器。

包内联固定 Harness 提交中的 Models 页面实现，但不修改全局 DSH 文件；卸载后官方 Models 页面自动恢复。控件只编辑已经存在于表单中的模型，省略 `models`、继续使用官方 catalog 的提供方保持原状。

内联的 DeepSeek Harness 源码在 `THIRD_PARTY_NOTICES.md` 中保留上游许可证和版权声明。

能力编辑和其他模型字段共享同一个表单 draft，由官方“应用”操作携带最近读取的 namespace revision 一次保存。

## 安装

```powershell
dsh plugin --profile web add dsh-model-config@0.2.0
```

接管后的 Models 页面和两个编辑器均包含在这个包中，没有需要单独发布或安装的功能依赖。

## 模型体验

无。该包只渲染浏览器设置并写入部署配置，不直接增加模型请求内容。

#### KV Cache 影响

无；实际请求变化仅来自用户保存的官方模型配置字段。

## 已知限制

- 只显示显式声明的 pi-ai 模型，不把官方 catalog 具化进用户设置。
- 自定义提供方获取模型时会补齐容量：优先保留接口返回值，再按模型 ID 使用固定 catalog 中无冲突的字段，最后回退到 `262144` 上下文窗口和 `32768` 最大输出；已有模型行不被重新获取覆盖。
- 仅在 rc8 接受 `compat.supportsDeveloperRole` 的 `openai-completions` 和三种 OpenAI Responses 协议中显示提示词角色选择。
