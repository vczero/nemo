/**
 * Chart Registry
 *
 * 图表类型注册表. 每种图表通过 registerChart() 注册,
 * 包含元数据、默认配置、demo 实例、transformer 等完整定义.
 */
import type { ChartType, ChartDefinition, ChartInstance, ChartConfig } from '../types'

const DEMO_CHART_PREFIX = 'NAUTILAB_DEMO'

// ============================================================
// Registry (图表类型注册表)
// ============================================================

const CHART_REGISTRY = new Map<ChartType, ChartDefinition<any>>()
const DEMO_MAP = new Map<string, ChartInstance>()

/**
 * 注册一种图表类型
 */
export function registerChart<T extends ChartConfig>(definition: ChartDefinition<T>): void {
  if (CHART_REGISTRY.has(definition.type)) {
    console.warn(`[Chart Registry] Overwriting existing chart type: ${definition.type}`)
  }
  CHART_REGISTRY.set(definition.type, definition as ChartDefinition<T>)

  for (const demo of definition.demos) {
    DEMO_MAP.set(demo.chartId, demo)
  }
}

/**
 * 获取图表类型定义
 */
export function getChartDefinition(type: ChartType): ChartDefinition {
  const def = CHART_REGISTRY.get(type)
  if (!def) {
    throw new Error(`[Chart Registry] Chart type not registered: ${type}`)
  }
  return def
}

/**
 * 获取图表类型定义 (不抛异常)
 */
export function findChartDefinition<T extends ChartConfig = ChartConfig>(type: ChartType): ChartDefinition<T> | undefined {
  return CHART_REGISTRY.get(type)
}

/**
 * 获取所有已注册的图表类型定义
 */
export function getAllChartDefinitions(): ChartDefinition[] {
  return Array.from(CHART_REGISTRY.values())
}

// ============================================================
// Demo 相关
// ============================================================

/**
 * 判断 chartId 是否为 demo 图表
 */
export function isDemoChartId(chartId: string): boolean {
  return chartId.toUpperCase().includes(DEMO_CHART_PREFIX)
}

/**
 * 从所有已注册图表的 demos 中查找指定 demo
 */
export function loadDemoChart<T extends ChartConfig = ChartConfig>(chartId: string): ChartInstance<T> {
  const demo = DEMO_MAP.get(chartId)
  if (!demo) {
    throw new Error(`[Chart Registry] Demo chart not found: ${chartId}`)
  }
  return structuredClone(demo) as ChartInstance<T>
}

/**
 * 获取所有 demo 实例 (按图表类型分组的扁平列表)
 */
export function getAllDemos(): ChartInstance[] {
  const demos: ChartInstance[] = []
  for (const demo of DEMO_MAP.values()) {
    demos.push(demo)
  }
  return demos
}

/**
 * 获取所有 demo 实例的 Map (chartId → ChartInstance)
 */
export function getDemoMap<T extends ChartConfig = ChartConfig>(): Map<string, ChartInstance<T>> {
  return DEMO_MAP as Map<string, ChartInstance<T>>
}
