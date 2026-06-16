/**
 * Data Inference & Pivot Utilities
 *
 * 数据列分类、映射推断、长宽表转换.
 */

import type { DataMappingMeta, DataTable, MetricField } from '../types'

// ============================================================
// Column Classification (列分类)
// ============================================================

/**
 * 对数据列进行分类: 数值列 vs 分类列.
 *
 * 采样前 100 行, 若该列所有非空值均为数值 (number 类型或可转为数字的字符串), 则归为数值列, 否则归为分类列.
 */
export function classifyColumns(data: DataTable): {
  categoricalCols: string[]
  numericCols: string[]
} {
  const sampleSize = Math.min(100, data.length)
  const categoricalCols: string[] = []
  const numericCols: string[] = []
  const columns = data[0] as string[]

  for (let colIdx = 0; colIdx < columns.length; colIdx++) {
    const col = columns[colIdx]
    let isNumeric = true
    let hasNonEmpty = false

    // Start from 1 to skip header
    for (let rowIdx = 1; rowIdx < sampleSize; rowIdx++) {
      // Check bounds
      if (rowIdx >= data.length) break

      const val = data[rowIdx][colIdx]
      if (val === null || val === undefined || val === '') continue
      hasNonEmpty = true

      if (typeof val === 'number') continue
      if (typeof val === 'string' && !isNaN(Number(val))) continue

      isNumeric = false
      break
    }

    // 全部为空值的列归为分类列
    if (isNumeric && hasNonEmpty) {
      numericCols.push(col)
    } else {
      categoricalCols.push(col)
    }
  }

  return { categoricalCols, numericCols }
}

// ============================================================
// DataMapping Inference (数据映射推断)
// ============================================================

/**
 * 检查当前 dataMapping 在新数据上是否仍然可用.
 */
export function isDataMappingCompatible(
  dataMapping: Record<string, unknown>,
  data: DataTable,
  meta: DataMappingMeta
): boolean {
  if (!data.length) return false

  const columns = new Set(data[0] as string[])

  for (const field of meta.fields) {
    const value = dataMapping[field.key]

    if (field.fieldType === 'single') {
      if (typeof value === 'string' && value !== '' && !columns.has(value)) {
        return false
      }
    } else if (field.fieldType === 'multiple') {
      if (Array.isArray(value) && value.length > 0) {
        const hasAnyValid = value.some(
          (m: { field?: string }) =>
            typeof m.field === 'string' && columns.has(m.field)
        )
        if (!hasAnyValid) return false
      }
    }
  }

  return true
}

export function generateEmptyDataMapping(meta: DataMappingMeta | null): Record<string, unknown> {
  const mapping: Record<string, unknown> = {}
  if (!meta) return mapping
  for (const field of meta.fields) {
    if (field.fieldType === 'single') {
      mapping[field.key] = ''
    } else if (field.fieldType === 'multiple') {
      mapping[field.key] = []
    } else {
      mapping[field.key] = ''
    }
  }
  return mapping
}

/**
 * 根据上传的数据和图表的 dataMappingMeta 自动推断 dataMapping.
 */
export function inferDataMapping(
  data: DataTable,
  meta: DataMappingMeta | null
): Record<string, any> {
  if (!data.length || !meta || !meta.fields.length || data.length > 500) return generateEmptyDataMapping(meta)

  const { categoricalCols, numericCols } = classifyColumns(data)
  const columns = data[0] as string[]

  // 按唯一值数量降序排列分类列:
  // 高基数列优先分配给 dimension, 低基数列留给 stackBy
  if (categoricalCols.length > 1) {
    const sampleSize = Math.min(data.length, 200)
    const cardinalityMap = new Map<string, number>()
    for (const col of categoricalCols) {
      const colIdx = columns.indexOf(col)
      const values = new Set<string>()
      for (let i = 1; i < sampleSize; i++) {
        values.add(String(data[i][colIdx]))
      }
      cardinalityMap.set(col, values.size)
    }
    categoricalCols.sort((a, b) => cardinalityMap.get(b)! - cardinalityMap.get(a)!)
  }

  const mapping: Record<string, any> = {}
  const usedCols = new Set<string>()
  // ── 第一轮: 分配所有字段 (stackBy 除外, 需要等 dimension/metrics 确定后再推断) ──
  for (const field of meta.fields) {
    if (field.key === 'stackBy') continue

    if (field.fieldType === 'single') {
      const prefersNumeric = field.key.toLowerCase().includes('value')
      const primaryPool = prefersNumeric ? numericCols : categoricalCols
      const fallbackPool = prefersNumeric ? categoricalCols : numericCols

      const col =
        primaryPool.find((c) => !usedCols.has(c)) ??
        fallbackPool.find((c) => !usedCols.has(c))

      if (col) {
        mapping[field.key] = col
        usedCols.add(col)
      } else {
        mapping[field.key] = ''
      }
    } else if (field.fieldType === 'multiple') {
      const defaults = field.metricDefaults ?? {}
      const availableNumeric = numericCols.filter((c) => !usedCols.has(c))

      if (availableNumeric.length > 0) {
        mapping[field.key] = availableNumeric.map((c) => ({
          ...defaults,
          field: c,
          alias: c,
        }))
        availableNumeric.forEach((c) => usedCols.add(c))
      } else {
        const remaining = columns.filter((c) => !usedCols.has(c))
        if (remaining.length > 0) {
          mapping[field.key] = [
            { ...defaults, field: remaining[0], alias: remaining[0] },
          ]
          usedCols.add(remaining[0])
        } else {
          mapping[field.key] = []
        }
      }
    }
  }

  // ── 第二轮: 推断 stackBy ──
  const stackByField = meta.fields.find((f) => f.key === 'stackBy')
  if (stackByField) {
    const dimension = mapping['dimension'] as string | undefined
    const metrics = Array.isArray(mapping['metrics'])
      ? (mapping['metrics'] as { field: string }[]).map((m) => m.field)
      : []

    if (dimension) {
      const suggested = suggestStackBy(data, dimension, metrics)
      if (suggested) {
        mapping['stackBy'] = suggested
      }
    }
  }

  return mapping
}

/**
 * 自动检测长表并推荐 stackBy 字段.
 */
export function suggestStackBy(
  data: DataTable,
  dimension: string,
  metricFields: string[] = []
): string | undefined {
  if (data.length <= 1 || !dimension) return undefined
  const header = data[0] as string[]
  const dimIndex = header.indexOf(dimension)
  if (dimIndex === -1) return undefined

  // Step 1: 检查维度列是否有重复值
  const dimValues = new Set()
  for (let i = 1; i < data.length; i++) {
    dimValues.add(String(data[i][dimIndex]))
  }
  const totalRows = data.length - 1

  if (dimValues.size >= totalRows) {
    return undefined
  }

  // Step 2: 维度有重复 → 在剩余列中找最佳分组候选
  const excludedSet = new Set([dimension, ...metricFields])
  const candidateIndices: number[] = []
  header.forEach((col, idx) => {
    if (!excludedSet.has(col)) candidateIndices.push(idx)
  })

  let bestCandidate: string | undefined
  let bestUniqueCount = Infinity

  for (const colIdx of candidateIndices) {
    const sampleSize = Math.min(100, data.length)
    let isNumeric = true
    for (let i = 1; i < sampleSize; i++) {
      const val = data[i][colIdx]
      if (
        typeof val !== 'number' &&
        (typeof val !== 'string' || val === '' || isNaN(Number(val)))
      ) {
        isNumeric = false
        break
      }
    }

    if (isNumeric) continue

    const uniqueValues = new Set()
    for (let i = 1; i < data.length; i++) {
      uniqueValues.add(String(data[i][colIdx]))
    }
    const uniqueCount = uniqueValues.size

    if (uniqueCount <= 1 || uniqueCount > totalRows * 0.3) continue

    if (uniqueCount < bestUniqueCount) {
      bestUniqueCount = uniqueCount
      bestCandidate = header[colIdx]
    }
  }

  return bestCandidate
}

// ============================================================
// Pivot (长宽表转换)
// ============================================================

// 长表数据缓存 (WeakMap: 按数据引用隔离, 多实例安全, 自动 GC)
const _pivotCache = new WeakMap<
  DataTable,
  {
    dimension: string
    stackBy: string
    valueFields: string | string[] | MetricField[]
    result: { pivotedData: DataTable | DataTable[]; groups: string[] }
  }
>()

/**
 * 将长表数据按 stackBy 字段 pivot 为宽表.
 */
export function pivotLongToWide(
  data: DataTable,
  dimension: string,
  stackBy: string,
  valueFields: string | string[] | MetricField[]
): { pivotedData: DataTable | DataTable[]; groups: string[] } {
  let oneDimensional = false
  if (typeof valueFields === 'string') {
    valueFields = [valueFields]
    oneDimensional = true
  }
  const header = data[0] as string[]
  const dimIdx = header.indexOf(dimension)
  const stackIdx = header.indexOf(stackBy)
  const valIndices = valueFields
    .map((vf) => {
      if (typeof vf === 'string') {
        return header.indexOf(vf)
      } else if (typeof vf === 'object' && 'field' in vf) {
        return header.indexOf(vf.field)
      } else {
        return -1
      }
    })
    .filter((idx) => idx !== -1)

  const groupSet = new Set<string>()
  const pivotMap = new Map<string, Record<string, any>>()

  if (dimIdx === -1 || stackIdx === -1 || valIndices.length === 0) {
    return {
      pivotedData: [],
      groups: [],
    }
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    const dimKey = String(row[dimIdx])
    const group = String(row[stackIdx])
    groupSet.add(group)

    if (!pivotMap.has(dimKey)) {
      pivotMap.set(dimKey, { [dimension]: dimKey })
    }
    const pivotRow = pivotMap.get(dimKey)!
    for (let j = 0; j < valIndices.length; j++) {
      const valIdx = valIndices[j]
      const val = row[valIdx]
      if (pivotRow[group] && Array.isArray(pivotRow[group])) {
        pivotRow[group].push(val)
      } else {
        pivotRow[group] = [val]
      }
    }
  }

  const groups = Array.from(groupSet)

  const newDatasets = []
  for (let j = 0; j < valIndices.length; j++) {
    const newBody: DataTable = [[dimension, ...groups]]

    for (const [_, rowObj] of pivotMap) {
      const newRow = [rowObj[dimension]]
      groups.forEach((g) => {
        newRow.push(rowObj[g][j] ?? null)
      })
      newBody.push(newRow)
    }
    newDatasets.push(newBody)
  }

  return {
    pivotedData:
      oneDimensional && newDatasets.length === 1 ? newDatasets[0] : newDatasets,
    groups,
  }
}

export function getCachedPivot(
  data: DataTable,
  dimension: string,
  stackBy: string,
  valueFields: string
): { pivotedData: DataTable; groups: string[] }
export function getCachedPivot(
  data: DataTable,
  dimension: string,
  stackBy: string,
  valueFields: string[] | MetricField[]
): { pivotedData: DataTable[]; groups: string[] }
export function getCachedPivot(
  data: DataTable,
  dimension: string,
  stackBy: string,
  valueFields: string | string[] | MetricField[]
) {
  const cached = _pivotCache.get(data)
  if (
    cached &&
    cached.dimension === dimension &&
    cached.stackBy === stackBy &&
    cached.valueFields === valueFields
  ) {
    return cached.result
  }
  const result = pivotLongToWide(data, dimension, stackBy, valueFields)
  _pivotCache.set(data, { dimension, stackBy, valueFields, result })
  return result
}

/** @deprecated WeakMap 自动按数据引用清理, 无需手动调用 */
export function clearPivotCache() {
  // no-op: WeakMap entries are automatically cleaned up when data is GC'd
}
