/**
 * Selectors
 *
 * 从 EditorStore 中派生计算值.
 * 以纯函数形式定义, 配合 zustand 的 selector 使用:
 *   const columns = useEditorStore(selectColumns)
 */
import type { EditorState } from './types'
import type { ChartDefinition } from '../types/definition'
import { findChartDefinition } from './registry'
import type { ChartType } from '../types'

/**
 * 从数据中提取列名
 */
export const selectColumns = (state: EditorState): string[] => {
  if (!state.chartData || state.chartData.length === 0) return []
  return state.chartData[0] as string[]
}

/**
 * 是否为 demo 模式
 */
export const selectIsDemo = (state: EditorState): boolean => {
  return state.mode === 'demo'
}

/**
 * 是否可以进行数据编辑操作
 */
export const selectCanEditData = (state: EditorState): boolean => {
  return state.status === 'ready' && state.chartData !== null
}

/**
 * 是否有数据
 */
export const selectHasData = (state: EditorState): boolean => {
  return state.chartData !== null && state.chartData.length > 0
}

/**
 * 编辑器是否就绪
 */
export const selectIsReady = (state: EditorState): boolean => {
  return state.status === 'ready'
}

/**
 * 是否正在加载
 */
export const selectIsLoading = (state: EditorState): boolean => {
  return state.status === 'loading'
}

/**
 * 是否正在同步
 */
export const selectIsSyncing = (state: EditorState): boolean => {
  return state.syncStatus === 'syncing'
}

/**
 * 当前图表的类型定义 (从 chartConfig.type 派生)
 */
export const selectChartDefinition = (state: EditorState): ChartDefinition | null => {
  return state.chartConfig?.type ? findChartDefinition(state.chartConfig.type) ?? null : null
}

export const selectChartType = (state: EditorState): ChartType | null => {
  return state.chartConfig?.type ?? null
}

export const selectChartWidth = (state: EditorState): number | null => {
  return state.chartConfig?.size?.width ?? null
}

export const selectChartHeight = (state: EditorState): number | null => {
  return state.chartConfig?.size?.height ?? null
}

export const selectChartDataMapping = (state: EditorState): Record<string, unknown> | null => {
  return state.chartConfig?.dataMapping ?? null
}

