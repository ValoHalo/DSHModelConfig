#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const DEFAULT_CONTEXT_WINDOW = 262_144
const DEFAULT_MAX_TOKENS = 32_768

const { values } = parseArgs({
  options: {
    harness: { type: 'string' },
    output: { type: 'string' },
  },
  allowPositionals: false,
})

if (values.harness === undefined || values.output === undefined) {
  throw new Error('usage: generate-model-capacity-defaults.mjs --harness <path> --output <path>')
}

const harnessRoot = resolve(values.harness)
const output = resolve(values.output)
const catalogModule = join(
  harnessRoot,
  'packages',
  'llm',
  'llm-pi-ai',
  'node_modules',
  '@earendil-works',
  'pi-ai',
  'dist',
  'providers',
  'all.js',
)

if (!existsSync(catalogModule)) {
  throw new Error(`pi-ai catalog was not found: ${catalogModule}; install the prepared Harness dependencies first`)
}

const { getBuiltinModels, getBuiltinProviders } = await import(pathToFileURL(catalogModule).href)
const collected = new Map()
for (const provider of getBuiltinProviders()) {
  for (const model of getBuiltinModels(provider)) {
    const capacities = collected.get(model.id) ?? { contextWindows: new Set(), maxTokens: new Set() }
    capacities.contextWindows.add(model.contextWindow)
    capacities.maxTokens.add(model.maxTokens)
    collected.set(model.id, capacities)
  }
}

const oneOrFallback = (candidates, fallback) => candidates.size === 1 ? [...candidates][0] : fallback
const entries = [...collected.entries()]
  .map(([id, capacities]) => [
    id,
    oneOrFallback(capacities.contextWindows, DEFAULT_CONTEXT_WINDOW),
    oneOrFallback(capacities.maxTokens, DEFAULT_MAX_TOKENS),
  ])
  .filter(([, contextWindow, maxTokens]) =>
    contextWindow !== DEFAULT_CONTEXT_WINDOW || maxTokens !== DEFAULT_MAX_TOKENS)
  .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)

const rows = entries.map(([id, contextWindow, maxTokens]) =>
  `  ${JSON.stringify(id)}: [${String(contextWindow)}, ${String(maxTokens)}],`)
const source = `/**
 * Generated from the pi-ai catalog pinned by upstream/harness.json.
 *
 * Generate with scripts/generate-model-capacity-defaults.mjs. When providers
 * disagree for one id, the conflicting field uses the route fallback.
 */

/** Context and output capacities persisted for one fetched model. */
export interface ModelCapacityDefaults {
  contextWindow: number
  maxTokens: number
}

interface CapacityModel extends Record<string, unknown> {
  id: string
  contextWindow?: number
  maxTokens?: number
}

const FALLBACK: Readonly<ModelCapacityDefaults> = {
  contextWindow: ${String(DEFAULT_CONTEXT_WINDOW)},
  maxTokens: ${String(DEFAULT_MAX_TOKENS)},
}

const BY_MODEL_ID: Readonly<Record<string, readonly [number, number]>> = {
${rows.join('\n')}
}

/**
 * Fill capacities the provider did not disclose from same-id catalog data.
 * @param model - fetched model metadata.
 * @returns the model with both capacity fields populated.
 */
export function withModelCapacityDefaults<T extends CapacityModel>(
  model: T,
): T & ModelCapacityDefaults & Record<string, unknown> {
  const matched = BY_MODEL_ID[model.id]
  const contextWindow = matched?.[0] ?? FALLBACK.contextWindow
  const maxTokens = matched?.[1] ?? FALLBACK.maxTokens
  return {
    ...model,
    contextWindow: model.contextWindow ?? contextWindow,
    maxTokens: model.maxTokens ?? maxTokens,
  }
}
`

mkdirSync(dirname(output), { recursive: true })
writeFileSync(output, source, 'utf8')
console.log(`Generated model capacity defaults: ${output}`)
