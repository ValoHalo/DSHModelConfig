import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, onTestFinished, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { TestRemote } from '@deepseek-ai/dsh-client-test-runtime'
import { remoteDefaultResponses } from '@deepseek-ai/dsh-client-test-runtime/src/assembly/remote-default-responses.ts'
import { RemoteMock } from '@deepseek-ai/dsh-remote-mock'
import { apply as settingsApply, inject as settingsInject } from '@deepseek-ai/dsh-client-ui-settings/client'
import { apply as stockApply, inject as stockInject } from '@deepseek-ai/dsh-client-ui-settings-models/client'
import { apply, inject } from '../src/client/index.ts'
import { MODEL_CAPABILITY_SLOT } from '../src/client/model-capability-slot.ts'
import { ModelsSection } from '../src/host-models/client/ModelsSection.tsx'
import type { ModelsSectionInjected } from '../src/host-models/client/ModelsSection.tsx'

describe('stock Models integration', () => {
  it('loads through Remote and preserves stock extensions and onboarding', async () => {
    const ctx = new Context()
    const mock = RemoteMock.create().load(remoteDefaultResponses)
    onTestFinished(() => mock.assertNoUnmatched())
    await ctx.plugin(SlotRegistry).await()
    const locale = new LocaleRuntime(ctx)
    ctx.provide('locale', locale)
    const discoverModels = vi.fn(async () => ({ ok: true, value: [{ id: 'private-model' }] }))
    const mutate = vi.fn(async () => ({ ok: false, error: { code: 'settings/conflict', message: 'Changed revision' } }))
    const remote = new TestRemote(ctx, {
      credentials: { describe: vi.fn(async () => ({ ok: true, value: {} })) },
      llm: {
        listProviders: vi.fn(async () => ({ ok: true, value: [] })),
        listConfigurableProviders: vi.fn(async () => ({ ok: true, value: [] })),
        discoverModels,
      },
      settings: { describe: mock.remote.settings.describe, mutate },
    })
    remote.$host = { home: undefined, isLoopback: true }
    await ctx.plugin({ inject: [...settingsInject], apply: settingsApply }).await()
    const slots = ctx.get('slots') as SlotRegistry
    slots.register({
      name: 'root',
      children: {
        'settings.section': { kind: 'list', scope: 'root' },
        'settings.onboarding': { kind: 'list', scope: 'root' },
      },
    } as never, () => null)
    const plugin = ctx.plugin({ inject: [...inject], apply })
    await plugin.await()

    expect(slots.entriesOfSlot('settings.section')).toHaveLength(1)
    expect(slots.entries('settings.section')).toHaveLength(1)
    const entry = slots.entriesOfSlot('settings.section')[0]!
    expect(entry.component).toBe(ModelsSection)
    expect(slots.spec('settings.models.provider-card')).toMatchObject({ kind: 'keyed' })
    expect(slots.spec('settings.models.footer')).toMatchObject({ kind: 'list' })
    expect(slots.entriesOfSlot(MODEL_CAPABILITY_SLOT)).toHaveLength(1)
    expect(slots.entriesOfSlot('settings.onboarding')).toHaveLength(2)

    const injected = (entry.inject as unknown as () => ModelsSectionInjected)()
    await injected.controller.load()
    expect(injected.controller.store.getSnapshot()).toMatchObject({ status: 'ready' })
    const request = { provider: 'test', api: 'openai-completions' }
    await expect(injected.operations.discoverModels('llm-pi-ai', request))
      .resolves.toEqual({ kind: 'found', models: [{ id: 'private-model' }] })
    expect(discoverModels).toHaveBeenCalledWith('llm-pi-ai', request)
    const ops = [{ op: 'set' as const, path: ['providers', 'test', 'models'], value: [
      { id: 'private-model', input: ['text', 'image'], reasoningEfforts: { high: 'high' } },
    ] }]
    await expect(injected.operations.writeSettings('llm-pi-ai', ops, 7))
      .resolves.toEqual({ kind: 'conflict', message: 'Changed revision' })
    expect(mutate).toHaveBeenCalledWith('llm-pi-ai', ops, 7)

    await plugin.dispose()
    expect(slots.entriesOfSlot('settings.section')).toHaveLength(0)
    await ctx.plugin({ inject: [...stockInject], apply: stockApply }).await()
    expect(slots.entriesOfSlot('settings.section')).toHaveLength(1)
    expect(slots.entriesOfSlot('settings.section')[0]?.component).not.toBe(ModelsSection)
    expect(slots.entriesOfSlot('settings.onboarding')).toHaveLength(2)
  })
})
