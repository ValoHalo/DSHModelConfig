// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ReasoningEffortSection, REASONING_PRESETS, requestField, withReasoning,
} from '../src/client/ReasoningEffortSection.tsx'
import type { ReasoningEffortSectionProps } from '../src/client/ReasoningEffortSection.tsx'
import { en } from '../src/client/reasoning-effort-locales.ts'

afterEach(cleanup)

const t: ReasoningEffortSectionProps['t'] = (key, params) => {
  const template = en[key as keyof typeof en] ?? key
  if (params === undefined) return template
  return template.replace(/\{(\w+)\}/gu, (match, name: string) =>
    name in params ? String(params[name]) : match)
}
function mount(
  model: Readonly<Record<string, unknown>>,
  onChange = vi.fn(),
  protocol = 'openai-completions',
) {
  render(
    <ReasoningEffortSection
      model={model}
      position={1}
      protocol={protocol}
      disabled={false}
      onChange={onChange}
      t={t}
    />,
  )
  return onChange
}

describe('ReasoningEffortSection', () => {
  it('shows preset levels read-only and makes mappings editable in custom mode', () => {
    mount({ id: 'reasoner', reasoningEfforts: REASONING_PRESETS.deepseek.efforts })

    const preset = screen.getByLabelText<HTMLSelectElement>(`${en.preset} 1`)
    expect([...preset.options].map(option => option.textContent)).toEqual([
      en.presetOpenAI,
      en.presetAnthropic,
      en.presetXAI,
      en.presetKimi,
      en.presetGLM,
      en.presetDeepSeek,
    ])
    expect([...preset.options].some(option => option.textContent?.includes('Gemini'))).toBe(false)
    expect(screen.getByText(en.levels)).toBeTruthy()
    expect(screen.getByLabelText<HTMLInputElement>(`${en.value} high 1`).readOnly).toBe(true)
    expect(screen.getByLabelText<HTMLInputElement>(`${en.requestField} 1`).readOnly).toBe(true)

    fireEvent.click(screen.getByText(en.customMode))

    expect(screen.getByText(en.mapping)).toBeTruthy()
    expect(screen.getByLabelText<HTMLInputElement>(`${en.value} high 1`).readOnly).toBe(false)
    expect(screen.getByLabelText(`${en.addLevel} 1`)).toBeTruthy()
  })

  it('writes the selected preset through existing model fields and preserves unrelated fields', () => {
    const onChange = mount({
      id: 'reasoner',
      name: 'Reasoner',
      reasoningEfforts: REASONING_PRESETS.openai.efforts,
      compat: { futureFlag: 'keep' },
    })
    fireEvent.change(screen.getByLabelText(`${en.preset} 1`), { target: { value: 'deepseek' } })

    expect(onChange).toHaveBeenCalledWith({
      id: 'reasoner',
      name: 'Reasoner',
      reasoningEfforts: { off: null, low: 'low', high: 'high', max: 'max' },
      compat: { futureFlag: 'keep', thinkingFormat: 'deepseek', supportsReasoningEffort: true },
    })
  })

  it('keeps custom request dialects explicit and removes only owned compatibility fields on restore', () => {
    expect(requestField('openai-responses', 'openai')).toBe('reasoning.effort')
    expect(requestField('anthropic-messages', 'openai')).toBe('output_config.effort / thinking.budget_tokens')
    expect(withReasoning({
      id: 'm',
      reasoningEfforts: { high: 'high' },
      compat: {
        thinkingFormat: 'zai', supportsReasoningEffort: true, futureFlag: 1,
      },
    }, undefined, 'openai-completions')).toEqual({
      id: 'm',
      compat: { futureFlag: 1 },
    })
  })

  it('preserves inherited-protocol compatibility fields while changing effort levels', () => {
    expect(withReasoning({
      id: 'm',
      reasoningEfforts: { high: 'high' },
      compat: {
        thinkingFormat: 'deepseek', supportsReasoningEffort: true, futureFlag: 1,
      },
    }, { low: 'low', high: 'high' }, undefined, 'openai')).toEqual({
      id: 'm',
      reasoningEfforts: { low: 'low', high: 'high' },
      compat: {
        thinkingFormat: 'deepseek', supportsReasoningEffort: true, futureFlag: 1,
      },
    })
  })

})
