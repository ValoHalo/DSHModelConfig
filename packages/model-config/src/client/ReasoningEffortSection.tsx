import { useState } from 'react'
import type { ReactNode } from 'react'
import { IconPlusOutline16, IconTrashOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import type { ReasoningEffortKey } from './reasoning-effort-locales.ts'
import css from './ReasoningEffortSection.module.css'

/** Canonical effort ids shared by Harness, pi-ai, and the composer. */
export const REASONING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const

type ReasoningLevel = typeof REASONING_LEVELS[number]
type ReasoningEfforts = Partial<Record<ReasoningLevel, string | null>>
type ReasoningMode = 'preset' | 'custom'
type ReasoningPresetId = 'openai' | 'anthropic' | 'xai' | 'kimi' | 'glm' | 'deepseek'
type PromptRoleMode = 'automatic' | 'developer' | 'system'
type ThinkingFormat = 'openai' | 'deepseek' | 'openrouter' | 'together' | 'zai' | 'qwen'
| 'chat-template' | 'qwen-chat-template' | 'string-thinking' | 'ant-ling'

interface ReasoningPreset {
  label: ReasoningEffortKey
  format: ThinkingFormat
  efforts: ReasoningEfforts
}

/** Manual presets; selection never depends on a model id. */
export const REASONING_PRESETS: Readonly<Record<ReasoningPresetId, ReasoningPreset>> = {
  openai: {
    label: 'presetOpenAI',
    format: 'openai',
    efforts: {
      off: 'none', minimal: 'minimal', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max',
    },
  },
  anthropic: {
    label: 'presetAnthropic',
    format: 'openai',
    efforts: { off: null, low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'max' },
  },
  xai: {
    label: 'presetXAI',
    format: 'openai',
    efforts: { low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh' },
  },
  kimi: {
    label: 'presetKimi',
    format: 'openai',
    efforts: { low: 'low', high: 'high', max: 'max' },
  },
  glm: {
    label: 'presetGLM',
    format: 'zai',
    efforts: { off: null, high: 'high', max: 'max' },
  },
  deepseek: {
    label: 'presetDeepSeek',
    format: 'deepseek',
    efforts: { off: null, low: 'low', high: 'high', max: 'max' },
  },
}

const REASONING_PRESET_IDS = Object.keys(REASONING_PRESETS) as ReasoningPresetId[]
const THINKING_FORMATS: readonly ThinkingFormat[] = [
  'openai', 'deepseek', 'openrouter', 'together', 'zai', 'qwen', 'chat-template',
  'qwen-chat-template', 'string-thinking', 'ant-ling',
]

const OPENAI_RESPONSES_PROTOCOLS = new Set([
  'openai-responses', 'azure-openai-responses', 'openai-codex-responses',
])

export interface ReasoningEffortSectionProps {
  model: Readonly<Record<string, unknown>>
  position: number
  protocol?: string
  disabled: boolean
  onChange: (model: Record<string, unknown>) => void
  t: Translate<ReasoningEffortKey>
}

/** Return a model's configured effort dictionary or explicit disabled state. */
export function reasoningEffortsOf(model: Readonly<Record<string, unknown>>): ReasoningEfforts | false | undefined {
  const value = model['reasoningEfforts']
  if (value === false) return false
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined
  const source = value as Record<string, unknown>
  return Object.fromEntries(REASONING_LEVELS.flatMap((level) => {
    const wire = source[level]
    return typeof wire === 'string' || wire === null ? [[level, wire]] : []
  })) as ReasoningEfforts
}

function sameEfforts(left: ReasoningEfforts, right: ReasoningEfforts): boolean {
  return REASONING_LEVELS.every(level => left[level] === right[level])
}

function presetOf(efforts: ReasoningEfforts | false | undefined): ReasoningPresetId | undefined {
  if (efforts === undefined || efforts === false) return undefined
  return REASONING_PRESET_IDS.find(id => sameEfforts(efforts, REASONING_PRESETS[id].efforts))
}

function compatOf(model: Readonly<Record<string, unknown>>): Record<string, unknown> {
  const value = model['compat']
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? { ...value as Record<string, unknown> }
    : {}
}

function thinkingFormatOf(model: Readonly<Record<string, unknown>>, fallback: ThinkingFormat): ThinkingFormat {
  const value = compatOf(model)['thinkingFormat']
  return typeof value === 'string' && THINKING_FORMATS.includes(value as ThinkingFormat)
    ? value as ThinkingFormat
    : fallback
}

function formatSupportsEffort(format: ThinkingFormat): boolean | undefined {
  return ['openai', 'deepseek', 'together', 'zai'].includes(format) ? true : undefined
}

function promptRoleOf(model: Readonly<Record<string, unknown>>): PromptRoleMode {
  const value = compatOf(model)['supportsDeveloperRole']
  return value === true ? 'developer' : value === false ? 'system' : 'automatic'
}

/** Replace only the prompt-role compatibility switch while preserving other model fields. */
export function withPromptRole(
  model: Readonly<Record<string, unknown>>,
  role: PromptRoleMode,
): Record<string, unknown> {
  const next = { ...model }
  const compat = compatOf(model)
  if (role === 'automatic') Reflect.deleteProperty(compat, 'supportsDeveloperRole')
  else compat['supportsDeveloperRole'] = role === 'developer'
  if (Object.keys(compat).length === 0) Reflect.deleteProperty(next, 'compat')
  else next['compat'] = compat
  return next
}

/** Return the request field controlled by the active protocol and dialect. */
export function requestField(protocol: string | undefined, format: ThinkingFormat): string {
  if (protocol !== undefined && OPENAI_RESPONSES_PROTOCOLS.has(protocol)) return 'reasoning.effort'
  if (protocol === 'anthropic-messages') return 'output_config.effort / thinking.budget_tokens'
  if (protocol !== 'openai-completions') return 'provider protocol'
  switch (format) {
    case 'deepseek':
    case 'zai': return 'thinking.type + reasoning_effort'
    case 'openrouter':
    case 'ant-ling': return 'reasoning.effort'
    case 'together': return 'reasoning.enabled + reasoning_effort'
    case 'qwen': return 'enable_thinking'
    case 'chat-template':
    case 'qwen-chat-template': return 'chat_template_kwargs'
    case 'string-thinking': return 'thinking'
    case 'openai': return 'reasoning_effort'
  }
}

/** Replace this section's reasoning fields while preserving unrelated compatibility fields. */
export function withReasoning(
  model: Readonly<Record<string, unknown>>,
  efforts: ReasoningEfforts | false | undefined,
  protocol: string | undefined,
  format?: ThinkingFormat,
): Record<string, unknown> {
  const next = { ...model }
  if (efforts === undefined) Reflect.deleteProperty(next, 'reasoningEfforts')
  else next['reasoningEfforts'] = efforts

  const compat = compatOf(model)
  if (protocol === 'openai-completions' && format !== undefined) {
    compat['thinkingFormat'] = format
    const supports = formatSupportsEffort(format)
    if (supports === undefined) Reflect.deleteProperty(compat, 'supportsReasoningEffort')
    else compat['supportsReasoningEffort'] = supports
  } else if (efforts === undefined || (protocol !== undefined && protocol !== 'openai-completions')) {
    Reflect.deleteProperty(compat, 'thinkingFormat')
    Reflect.deleteProperty(compat, 'supportsReasoningEffort')
  }
  if (Object.keys(compat).length === 0) Reflect.deleteProperty(next, 'compat')
  else next['compat'] = compat
  return next
}

/** Per-model reasoning-effort fold contributed to the model capability page. */
export function ReasoningEffortSection(props: ReasoningEffortSectionProps): ReactNode {
  const { model, protocol, t, disabled } = props
  const efforts = reasoningEffortsOf(model)
  const inferredPreset = presetOf(efforts)
  const [mode, setMode] = useState<ReasoningMode>(() =>
    efforts !== false && efforts !== undefined && inferredPreset === undefined ? 'custom' : 'preset')
  const enabled = efforts !== undefined && efforts !== false
  const selectedPreset = inferredPreset ?? 'openai'
  const selectedDefinition = REASONING_PRESETS[selectedPreset]
  const format = thinkingFormatOf(model, selectedDefinition.format)
  const configured = Object.hasOwn(model, 'reasoningEfforts')
    || Object.hasOwn(compatOf(model), 'thinkingFormat')
    || Object.hasOwn(compatOf(model), 'supportsReasoningEffort')
  const activeEfforts: ReasoningEfforts = efforts !== undefined && efforts !== false ? efforts : {}
  const activeLevels = REASONING_LEVELS.filter(level => Object.hasOwn(activeEfforts, level))
  const remainingLevels = REASONING_LEVELS.filter(level => !Object.hasOwn(activeEfforts, level))
  const promptRole = promptRoleOf(model)
  const supportsPromptRole = protocol === 'openai-completions'
    || protocol !== undefined && OPENAI_RESPONSES_PROTOCOLS.has(protocol)

  const applyPreset = (id: ReasoningPresetId): void => {
    const preset = REASONING_PRESETS[id]
    props.onChange(withReasoning(model, { ...preset.efforts }, protocol, preset.format))
  }
  const updateEfforts = (next: ReasoningEfforts): void => {
    props.onChange(withReasoning(model, next, protocol, format))
  }
  const summary = efforts === false
    ? t('off')
    : efforts === undefined
      ? t('inherited')
      : inferredPreset === undefined ? t('customMode') : t(REASONING_PRESETS[inferredPreset].label)

  return (
    <section className={css.modelFold}>
      <div className={css.modelFoldHeader}>
        <span>{t('title')}</span>
        <span className={css.modelFoldMeta}>{summary}</span>
      </div>
      <div className={css.modelFoldBody}>
        <div className={css.reasoningEditor}>
              <div className={css.reasoningHeader}>
                <span className={css.modelFieldLabel}>{t('configuration')}</span>
                <div className={css.reasoningHeaderActions}>
                  {configured
                    ? (
                      <button
                        type="button"
                        className={css.linkButton}
                        disabled={disabled}
                        onClick={() => { props.onChange(withReasoning(model, undefined, protocol)) }}
                      >
                        {t('restore')}
                      </button>
                    )
                    : null}
                  <label className={css.reasoningSwitch}>
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={disabled}
                      aria-label={`${t('enabled')} ${props.position}`}
                      onChange={(event) => {
                        if (event.target.checked) applyPreset(selectedPreset)
                        else props.onChange(withReasoning(model, false, protocol, format))
                      }}
                    />
                    <span>{t('enabled')}</span>
                  </label>
                </div>
              </div>

              {supportsPromptRole
                ? (
                  <label className={css.modelField}>
                    <span className={css.modelFieldLabel}>{t('promptRole')}</span>
                    <select
                      className={`${css.input} ${css.selectInput}`}
                      value={promptRole}
                      aria-label={`${t('promptRole')} ${props.position}`}
                      disabled={disabled}
                      onChange={(event) => {
                        props.onChange(withPromptRole(model, event.target.value as PromptRoleMode))
                      }}
                    >
                      <option value="automatic">{t('promptRoleAutomatic')}</option>
                      <option value="developer">{t('promptRoleDeveloper')}</option>
                      <option value="system">{t('promptRoleSystem')}</option>
                    </select>
                  </label>
                )
                : null}

              {enabled
                ? (
                  <>
                    <div className={css.reasoningMode} role="group" aria-label={`${t('mode')} ${props.position}`}>
                      <button
                        type="button"
                        aria-pressed={mode === 'preset'}
                        disabled={disabled}
                        onClick={() => {
                          setMode('preset')
                          applyPreset(selectedPreset)
                        }}
                      >
                        {t('presetMode')}
                      </button>
                      <button
                        type="button"
                        aria-pressed={mode === 'custom'}
                        disabled={disabled}
                        onClick={() => { setMode('custom') }}
                      >
                        {t('customMode')}
                      </button>
                    </div>

                    <div className={css.reasoningControls}>
                      {mode === 'preset'
                        ? (
                          <label className={css.modelField}>
                            <span className={css.modelFieldLabel}>{t('preset')}</span>
                            <select
                              className={`${css.input} ${css.selectInput}`}
                              value={selectedPreset}
                              aria-label={`${t('preset')} ${props.position}`}
                              disabled={disabled}
                              onChange={(event) => { applyPreset(event.target.value as ReasoningPresetId) }}
                            >
                              {REASONING_PRESET_IDS.map(id => (
                                <option key={id} value={id}>{t(REASONING_PRESETS[id].label)}</option>
                              ))}
                            </select>
                          </label>
                        )
                        : protocol === 'openai-completions'
                          ? (
                            <label className={css.modelField}>
                              <span className={css.modelFieldLabel}>{t('format')}</span>
                              <select
                                className={`${css.input} ${css.selectInput}`}
                                value={format}
                                aria-label={`${t('format')} ${props.position}`}
                                disabled={disabled}
                                onChange={(event) => {
                                  props.onChange(withReasoning(
                                    model,
                                    activeEfforts,
                                    protocol,
                                    event.target.value as ThinkingFormat,
                                  ))
                                }}
                              >
                                {THINKING_FORMATS.map(value => <option key={value} value={value}>{value}</option>)}
                              </select>
                            </label>
                          )
                          : null}
                      <label className={css.modelField}>
                        <span className={css.modelFieldLabel}>{t('requestField')}</span>
                        <input
                          className={`${css.input} ${css.readonlyInput}`}
                          type="text"
                          value={requestField(protocol, format)}
                          aria-label={`${t('requestField')} ${props.position}`}
                          readOnly
                        />
                      </label>
                    </div>

                    <section className={css.reasoningMapping}>
                      <div className={css.reasoningSubheader}>
                        <span>{mode === 'preset' ? t('levels') : t('mapping')}</span>
                        <span className={css.modelFoldMeta}>
                          {t('levelCount', { count: activeLevels.length })}
                        </span>
                      </div>
                      <div className={css.reasoningMap}>
                        {activeLevels.map(level => (
                          <div key={level} className={css.reasoningMapRow}>
                            <code>{level}</code>
                            <span aria-hidden>→</span>
                            <input
                              className={`${css.input} ${mode === 'preset' ? css.readonlyInput : ''}`}
                              type="text"
                              value={activeEfforts[level] ?? ''}
                              placeholder={level === 'off' ? t('noValue') : undefined}
                              aria-label={`${t('value')} ${level} ${props.position}`}
                              readOnly={mode === 'preset'}
                              disabled={disabled}
                              onChange={(event) => {
                                updateEfforts({
                                  ...activeEfforts,
                                  [level]: level === 'off' && event.target.value.length === 0
                                    ? null
                                    : event.target.value,
                                })
                              }}
                            />
                            {mode === 'custom'
                              ? (
                                <button
                                  type="button"
                                  className={`${css.iconButton} ${css.iconButtonDanger}`}
                                  aria-label={`${t('removeLevel')} ${level} ${props.position}`}
                                  disabled={disabled}
                                  onClick={() => {
                                    updateEfforts(Object.fromEntries(
                                      Object.entries(activeEfforts).filter(([key]) => key !== level),
                                    ) as ReasoningEfforts)
                                  }}
                                >
                                  <IconTrashOutline16 size={14} />
                                </button>
                              )
                              : <span />}
                          </div>
                        ))}
                        {mode === 'custom' && remainingLevels.length > 0
                          ? (
                            <label
                              className={`${css.reasoningAddLevel} ${disabled ? css.reasoningAddLevelDisabled : ''}`}
                            >
                              <IconPlusOutline16 size={14} />
                              <span>{t('addLevel')}</span>
                              <select
                                value=""
                                aria-label={`${t('addLevel')} ${props.position}`}
                                disabled={disabled}
                                onChange={(event) => {
                                  const level = event.target.value as ReasoningLevel
                                  if (level.length === 0) return
                                  updateEfforts({ ...activeEfforts, [level]: level === 'off' ? null : level })
                                }}
                              >
                                <option value="">{t('addLevel')}</option>
                                {remainingLevels.map(level => <option key={level} value={level}>{level}</option>)}
                              </select>
                            </label>
                          )
                          : null}
                      </div>
                    </section>
                  </>
                )
                : <p className={css.reasoningDisabled}>{t('disabled')}</p>}
        </div>
      </div>
    </section>
  )
}
