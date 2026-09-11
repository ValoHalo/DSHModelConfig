import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { apply as applyModels, inject as modelsInject } from '../host-models/client/index.ts'
import { ModelCapabilityFields } from './ModelCapabilityFields.tsx'
import type { ModelCapabilityFieldsInjected } from './ModelCapabilityFields.tsx'
import { MODEL_CAPABILITY_SLOT, type ModelCapabilityOwnerProps } from './model-capability-slot.ts'
import { en as inputEn, zh as inputZh, type ModelInputKey } from './model-input-locales.ts'
import { en as reasoningEn, zh as reasoningZh, type ReasoningEffortKey } from './reasoning-effort-locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-model-config.model-input': ModelInputKey
    'dsh-model-config.reasoning-effort': ReasoningEffortKey
  }
}

const INPUT_NS = 'dsh-model-config.model-input'
const REASONING_NS = 'dsh-model-config.reasoning-effort'

/** Services used by the Models page, onboarding, and capability controls. */
export const inject = [...modelsInject]

/** Register the bundled Models page and its inline capability editors. */
export function apply(ctx: ClientContext): void {
  applyModels(ctx)
  ctx.effect(() => ctx.locale.register(INPUT_NS, {
    zh: inputZh, en: inputEn,
  }), 'dsh-model-config: input dictionaries')
  ctx.effect(() => ctx.locale.register(REASONING_NS, {
    zh: reasoningZh, en: reasoningEn,
  }), 'dsh-model-config: reasoning dictionaries')

  const injected = (): ModelCapabilityFieldsInjected => ({
    inputT: ctx.locale.bind(INPUT_NS),
    reasoningT: ctx.locale.bind(REASONING_NS),
  })
  ctx.slots.inject(MODEL_CAPABILITY_SLOT, () => ctx.slots.register({
    name: MODEL_CAPABILITY_SLOT,
    id: 'dsh-model-config',
    order: 0,
    inject: injected,
  }, ModelCapabilityFields))
}

export type { ModelCapabilityOwnerProps }
export type { ModelInputSectionProps } from './ModelInputSection.tsx'
export type { ReasoningEffortSectionProps } from './ReasoningEffortSection.tsx'
