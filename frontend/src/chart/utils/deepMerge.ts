import type { DeepPartial } from '../core'

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: DeepPartial<T>
): T {
  const output = { ...target }
  for (const key of Object.keys(source)) {
    const sourceVal = (source as Record<string, unknown>)[key]
    const targetVal = (target as Record<string, unknown>)[key]
    if (
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      targetVal !== undefined &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      ;(output as Record<string, unknown>)[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as DeepPartial<Record<string, unknown>>
      )
    } else if (sourceVal !== undefined) {
      ;(output as Record<string, unknown>)[key] = sourceVal
    }
  }
  return output
}
