# Patch Design

English | [简体中文](patches.zh.md)

The repository keeps two patches against the pinned Harness commit. They build host-adapter packages; installing a release kit does not patch a user's local Harness source.

## Models Host Adapter

[`0001-model-settings-host.patch`](../patches/0001-model-settings-host.patch) changes `@deepseek-ai/dsh-client-ui-settings-models` to:

- declare the single-occupant `settings.models.model.input` and `settings.models.model.reasoning` slots;
- pass model drafts, disclosure state, and update callbacks to slot occupants;
- validate editable reasoning-effort maps;
- arrange Basic, Input Capability, and Reasoning Effort disclosures within each model row.

The patch contains no plugin registration, Web bundle dependency, workspace lockfile, or DSH-UO-specific path. Each plugin's own `cordis.patch.yml` decides whether it is active.

## pi-ai Host Adapter

[`0002-pi-ai-developer-role.patch`](../patches/0002-pi-ai-developer-role.patch) changes `@deepseek-ai/dsh-llm-pi-ai` to expose pi-ai's existing `compat.supportsDeveloperRole` support. Models using `openai-completions` or `openai-responses` can explicitly choose the `developer` or `system` prompt role.

## Version Requirement

The patches are supported only against the source commit in [`upstream/harness.json`](../upstream/harness.json). A Harness upgrade requires regenerated patches and freshly built adapters and plugin kits.
