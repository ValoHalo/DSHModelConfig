# @dsh-uo/client-ui-model-input

English | [中文](README.zh.md)

DeepSeek Harness client plugin for editing a model's request modalities from the Models settings page. It occupies the single `settings.models.model.input` slot declared by the Models host adapter and writes only the existing `input` model field.

The three curated modes are automatic, text only (`[text]`), and text with images (`[text, image]`). Automatic mode follows the reasoning mapping preset already selected for the same model: OpenAI GPT, Anthropic Claude, xAI Grok, and Kimi use text with images; GLM and DeepSeek use text only. Changing the preset updates input while the model remains in automatic mode. An explicit input selection stops that synchronization.

For a custom reasoning map or a model without a selected preset, automatic mode removes `input` and retains Harness's built-in catalog, provider `defaultInput`, and final text-only fallback. The plugin never guesses from a provider or model id and never probes an endpoint for capabilities. Unknown future modality lists are preserved until the user explicitly selects another mode.

The install kit enables this plugin through its own Cordis bundle layer. Removing the plugin removes the editor while Harness continues to honor previously saved `input` declarations.

## Standalone Distribution

This package declares both a client module and a DSH bundle layer, but the Models page needs the matching host adapter to declare its slot. GitHub Releases therefore ship both in `DSH-Plugin-Model-Input-<version>.zip`; do not install only this package tarball. See the [repository README](../../README.md) for installation.

## Retirement path

If Harness ships an equivalent editor, remove `@dsh-uo/client-ui-model-input` from the profile first. The Models page continues to work without a slot occupant. Then compare the upstream implementation before deciding whether to retain the Models host patch.

No user-data migration is required because the plugin stores only Harness's existing `input` field.
