import { describe, expect, it } from 'vitest'
import { withModelCapacityDefaults } from '../src/client/model-capacity-defaults.ts'

describe('model capacity defaults', () => {
  it('uses an unambiguous same-id catalog match', () => {
    expect(withModelCapacityDefaults({ id: 'claude-haiku-4-5' })).toEqual({
      id: 'claude-haiku-4-5',
      contextWindow: 200_000,
      maxTokens: 64_000,
    })
  })

  it('uses route fallbacks for unknown or conflicting ids', () => {
    expect(withModelCapacityDefaults({ id: 'private-model' })).toEqual({
      id: 'private-model',
      contextWindow: 262_144,
      maxTokens: 32_768,
    })
    expect(withModelCapacityDefaults({ id: 'gpt-4.1' })).toEqual({
      id: 'gpt-4.1',
      contextWindow: 262_144,
      maxTokens: 32_768,
    })
  })

  it('keeps capacities disclosed by the provider', () => {
    expect(withModelCapacityDefaults({
      id: 'claude-haiku-4-5',
      contextWindow: 123_456,
      maxTokens: 7_890,
    })).toEqual({
      id: 'claude-haiku-4-5',
      contextWindow: 123_456,
      maxTokens: 7_890,
    })
  })
})
