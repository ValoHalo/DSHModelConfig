# dsh-model-config

English | [中文](README.zh.md)

A single-package model-capability plugin for stock DSH Web. It takes over the existing `models` settings entry, declares a child slot inside each pi-ai model row, and contributes the input and reasoning editors through that slot.

The package inlines the Models implementation from the pinned Harness commit without modifying global DSH files; uninstalling restores the stock Models page. Controls edit only models already present in the form, while providers that omit `models` and use the stock catalog remain untouched.

The inlined DeepSeek Harness source retains its upstream license and copyright notice in `THIRD_PARTY_NOTICES.md`.

Capability edits share the stock form draft with the other model fields and are saved by the same Apply action with the latest namespace revision.

## Install

```powershell
dsh plugin --profile web add dsh-model-config@0.2.0
```

The shadow Models page and both editors are included in this package, with no separately published or installed feature dependencies.

## Model Experience

None. This package renders browser settings and writes deployment configuration without directly adding model-request content.

#### KV Cache effect

None; request changes come only from stock model configuration fields the user saves.

## Known Limitations

- Only explicitly declared pi-ai models appear; the stock catalog is never materialized into user settings.
- Fetched custom-provider models preserve capacities reported by the endpoint, then use unambiguous same-ID fields from the pinned catalog, and finally fall back to a `262144` context window and `32768` max output; fetching does not overwrite existing model rows.
- Stock rc.7 rejects `compat.supportsDeveloperRole`, so prompt-role selection is unavailable.
