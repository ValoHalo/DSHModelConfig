# Patch 说明

[English](patches.md) | 简体中文

仓库保留两个针对固定 Harness 提交的 Patch。它们用于构建宿主适配包，不会在用户安装插件时修改本地 Harness 源码。

## Models 宿主适配

[`0001-model-settings-host.patch`](../patches/0001-model-settings-host.patch) 修改 `@deepseek-ai/dsh-client-ui-settings-models`：

- 声明 `settings.models.model.input` 与 `settings.models.model.reasoning` 两个单实例 slot；
- 把模型草稿、展开状态和更新回调交给 slot 占用者；
- 校验可编辑的思考档位映射；
- 调整模型行的基础参数、输入能力和思考强度折叠布局。

Patch 不包含插件注册、Web bundle 依赖、workspace 锁文件或 DSH UO 专属路径。插件是否启用由各插件的 `cordis.patch.yml` 决定。

## pi-ai 宿主适配

[`0002-pi-ai-developer-role.patch`](../patches/0002-pi-ai-developer-role.patch) 修改 `@deepseek-ai/dsh-llm-pi-ai`，开放 pi-ai 已支持的 `compat.supportsDeveloperRole`。它允许 `openai-completions` 与 `openai-responses` 模型显式选择 `developer` 或 `system` 系统提示词角色。

## 版本要求

两个 Patch 只保证适用于 [`upstream/harness.json`](../upstream/harness.json) 指定的源码提交。升级 Harness 时必须重新生成 Patch，并重新构建全部适配包和插件套件。
