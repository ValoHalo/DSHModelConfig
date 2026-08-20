import type { ReactNode } from 'react'
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'
import { ModelInputSection } from './ModelInputSection.tsx'
import type { ModelInputKey } from './model-input-locales.ts'
import { ReasoningEffortSection } from './ReasoningEffortSection.tsx'
import type { ReasoningEffortKey } from './reasoning-effort-locales.ts'
import type { ModelCapabilityOwnerProps } from './model-capability-slot.ts'

export interface ModelCapabilityFieldsInjected {
  inputT: Translate<ModelInputKey>
  reasoningT: Translate<ReasoningEffortKey>
}

export type ModelCapabilityFieldsProps = ModelCapabilityOwnerProps
  & Partial<ModelCapabilityFieldsInjected>

/** Input and reasoning controls rendered inside one expanded official model row. */
export function ModelCapabilityFields(props: ModelCapabilityFieldsProps): ReactNode {
  if (props.inputT === undefined || props.reasoningT === undefined) return null
  return (
    <>
      <ModelInputSection
        model={props.model}
        position={props.position}
        disabled={props.disabled}
        onChange={props.onChange}
        t={props.inputT}
      />
      <ReasoningEffortSection
        model={props.model}
        position={props.position}
        {...props.protocol === undefined ? {} : { protocol: props.protocol }}
        disabled={props.disabled}
        onChange={props.onChange}
        t={props.reasoningT}
      />
    </>
  )
}
