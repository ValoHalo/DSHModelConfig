// @vitest-environment jsdom
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ModelCapabilityFields } from '../src/client/ModelCapabilityFields.tsx'
import { ModelCapabilitySlotContext } from '../src/client/model-capability-slot.ts'
import { en as inputEn } from '../src/client/model-input-locales.ts'
import { en as reasoningEn } from '../src/client/reasoning-effort-locales.ts'
import { ModelListEditor } from '../src/host-models/client/ModelListEditor.tsx'
import type { ModelDraft } from '../src/host-models/client/ModelListEditor.tsx'
import { en as modelsEn } from '../src/host-models/client/locales.ts'

afterEach(cleanup)

const inputT = (key: keyof typeof inputEn): string => inputEn[key]
const reasoningT = (key: keyof typeof reasoningEn): string => reasoningEn[key]
const modelsT = (key: keyof typeof modelsEn): string => modelsEn[key]

function Fixture() {
  const [models, setModels] = useState<ModelDraft[]>([
    { id: 'automatic' },
    { id: 'custom', input: ['text', 'image', 'audio'] },
  ])
  return (
    <ModelCapabilitySlotContext.Provider value={owner => (
      <ModelCapabilityFields {...owner} inputT={inputT} reasoningT={reasoningT} />
    )}
    >
      <output data-testid="models">{JSON.stringify(models)}</output>
      <ModelListEditor
        models={models}
        onChange={setModels}
        probe={{ settingsNs: 'llm-test', provider: 'test', api: 'openai-completions' }}
        api={{ llm: { discoverModels: vi.fn() } } as never}
        t={modelsT}
        disabled={false}
      />
    </ModelCapabilitySlotContext.Provider>
  )
}

describe('model row identity', () => {
  it('keeps capability state with its model when an earlier row is removed', () => {
    render(<Fixture />)
    for (const button of screen.getAllByLabelText(new RegExp(modelsEn.modelAdvanced))) {
      fireEvent.click(button)
    }
    expect(screen.getByText(inputEn.keepExisting)).toBeTruthy()

    fireEvent.click(screen.getAllByLabelText(new RegExp(modelsEn.removeModel))[0] as HTMLElement)

    expect(screen.getByText(inputEn.keepExisting)).toBeTruthy()
    expect(JSON.parse(screen.getByTestId('models').textContent ?? '[]')).toEqual([
      { id: 'custom', input: ['text', 'image', 'audio'] },
    ])
  })
})
