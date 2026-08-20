import { createContext } from 'react'
import type { ReactNode } from 'react'

export const MODEL_CAPABILITY_SLOT = 'dsh-model-config.model-capability' as const

/** Model-row draft shared by the integrated Models page and capability contributors. */
export interface ModelCapabilityOwnerProps {
  model: Readonly<Record<string, unknown>>
  position: number
  protocol?: string
  disabled: boolean
  onChange: (model: Record<string, unknown>) => void
}

export type RenderModelCapability = (owner: ModelCapabilityOwnerProps) => ReactNode

/** Render bridge supplied by the shadow Models section to its vendored row editor. */
export const ModelCapabilitySlotContext = createContext<RenderModelCapability | undefined>(undefined)

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    'dsh-model-config.model-capability': {
      kind: 'list'
      scope: 'root'
      owner: ModelCapabilityOwnerProps
    }
  }
}
