# @dsh-uo/client-ui-reasoning-effort

English | [中文](README.zh.md)

DeepSeek Harness client plugin for editing per-model reasoning effort from the Models settings page. It occupies the single `settings.models.model.reasoning` slot declared by the Models host adapter and writes only the existing Harness and pi-ai fields `reasoningEfforts`, `compat.thinkingFormat`, `compat.supportsReasoningEffort`, and `compat.supportsDeveloperRole`.

The plugin provides manual presets for OpenAI GPT, Anthropic Claude, xAI Grok, Kimi, GLM, and DeepSeek, plus a custom mapping mode. It never guesses a preset from the model ID. Gemini has no preset or dedicated adapter.

For `openai-completions` and `openai-responses`, the system-prompt role can keep pi-ai's protocol default or be fixed explicitly to `Developer` or `System`. The setting only overrides pi-ai's role selection and never probes the endpoint.

The install kit enables this plugin through its own Cordis bundle layer. Removing the plugin removes the reasoning UI while leaving the Models editor and its saved-data validation in place.

## Standalone Distribution

This package declares both a client module and a DSH bundle layer, but the Models page needs the matching host adapter to declare its slot, and explicit prompt-role selection needs the matching `llm-pi-ai` adapter. GitHub Releases therefore ship all three in `DSH-Plugin-Reasoning-Effort-<version>.zip`; do not install only this package tarball. See the [repository README](../../README.md) for installation.

## Retirement path

If Harness ships an equivalent editor, remove `@dsh-uo/client-ui-reasoning-effort` from the profile first. The Models page continues to work without a slot occupant. Then compare the upstream implementation before deciding whether to retain the Models and pi-ai host patches.

No migration of user settings is required: this plugin stores only fields already understood by Harness and pi-ai, with no DSH-UO marker or preset id.
