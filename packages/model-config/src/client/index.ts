import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { bindSnapshotSelector } from '@deepseek-ai/dsh-client-web-react'
import { ModelCapabilityFields } from './ModelCapabilityFields.tsx'
import type { ModelCapabilityFieldsInjected } from './ModelCapabilityFields.tsx'
import {
  MODEL_CAPABILITY_SLOT,
  type ModelCapabilityOwnerProps,
} from './model-capability-slot.ts'
import {
  en as inputEn, zh as inputZh, type ModelInputKey,
} from './model-input-locales.ts'
import {
  en as reasoningEn, zh as reasoningZh, type ReasoningEffortKey,
} from './reasoning-effort-locales.ts'
import { ModelsSection } from '../host-models/client/ModelsSection.tsx'
import type { ModelsSectionInjected } from '../host-models/client/ModelsSection.tsx'
import { ModelsSettingsStore } from '../host-models/client/store.ts'
import {
  en as modelsEn, zh as modelsZh, type ModelsKey,
} from '../host-models/client/locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-model-config.models': ModelsKey
    'dsh-model-config.model-input': ModelInputKey
    'dsh-model-config.reasoning-effort': ReasoningEffortKey
  }
}

const MODELS_NS = 'dsh-model-config.models'
const INPUT_NS = 'dsh-model-config.model-input'
const REASONING_NS = 'dsh-model-config.reasoning-effort'

/** Services used by the shadow Models page and its nested capability slot. */
export const inject = ['slots', 'locale', 'connection', 'remote']

/** Refetch only after the integrated Models page has been opened once. */
function refreshIfLoaded(controller: ModelsSettingsStore): void {
  if (controller.store.getSnapshot().status === 'idle') return
  void controller.load()
}

/** Replace the stock Models section with an installable slot-enabled copy. */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(MODELS_NS, { zh: modelsZh, en: modelsEn }), 'dsh-model-config: models dictionaries')
  ctx.effect(() => ctx.locale.register(INPUT_NS, {
    zh: inputZh, en: inputEn,
  }), 'dsh-model-config: input dictionaries')
  ctx.effect(() => ctx.locale.register(REASONING_NS, {
    zh: reasoningZh, en: reasoningEn,
  }), 'dsh-model-config: reasoning dictionaries')

  ctx.effect(() => {
    const rawEntries = ctx.slots.entries.bind(ctx.slots)
    const projectedEntries: typeof ctx.slots.entries = key => key === 'settings.section'
      ? ctx.slots.entriesOfSlot(key)
      : rawEntries(key)
    ctx.slots.entries = projectedEntries
    return () => {
      if (ctx.slots.entries === projectedEntries) ctx.slots.entries = rawEntries
    }
  }, 'dsh-model-config: project shadowed settings navigation')

  const connection = ctx.get('connection') as ConnectionHandle
  const controller = new ModelsSettingsStore(connection.api)
  const useSnapshot = bindSnapshotSelector(controller.store)
  const t = ctx.locale.bind(MODELS_NS) as ModelsSectionInjected['t']
  const injected = (): ModelsSectionInjected => ({
    controller,
    useSnapshot,
    api: connection.api,
    t,
  })

  ctx.effect(() => {
    const refresh = (): void => { refreshIfLoaded(controller) }
    const disposers = [
      ctx.remote.$on('settings/document-updated', refresh),
      ctx.remote.$on('credentials/updated', refresh),
      ctx.remote.$on('llm/adapters-updated', refresh),
      ctx.on('connection/reset', refresh),
    ]
    return () => { for (const dispose of disposers) dispose() }
  }, 'dsh-model-config: models invalidations')

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'models',
    order: 10,
    priority: -10,
    label: () => t('nav'),
    inject: injected,
    children: {
      [MODEL_CAPABILITY_SLOT]: { kind: 'list', scope: 'root' },
    },
  }, ModelsSection))

  const capabilityInjected = (): ModelCapabilityFieldsInjected => ({
    inputT: ctx.locale.bind(INPUT_NS),
    reasoningT: ctx.locale.bind(REASONING_NS),
  })
  ctx.slots.inject(MODEL_CAPABILITY_SLOT, () => ctx.slots.register({
    name: MODEL_CAPABILITY_SLOT,
    id: 'dsh-model-config',
    order: 0,
    inject: capabilityInjected,
  }, ModelCapabilityFields))
}

export type { ModelCapabilityOwnerProps }
export type { ModelInputSectionProps } from './ModelInputSection.tsx'
export type { ReasoningEffortSectionProps } from './ReasoningEffortSection.tsx'
