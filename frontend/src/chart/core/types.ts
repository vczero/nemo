import type { ChartConfig } from '../types'
import type { TUploadFileResponse } from '@/apis/types'

// ============================================================
// Utility Types
// ============================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type ChartData = any[][]

export type UploadChartFile = {
  originFileObj: File
  response: TUploadFileResponse
  fileContent?: ChartData
}

// ============================================================
// Editor State
// ============================================================

export interface EditorState {
  // ── Chart Instance ──
  /** 当前图表 ID */
  chartId: string | null

  /** 图表名称 */
  chartName: string
  /** 图表配置 (DSL v2) */
  chartConfig: ChartConfig | null
  /** 解析后的表格数据 (二维数组) */
  chartData: ChartData | null
  /** 远程数据文件 URL */
  chartFileUrl: string | null
  /** 远程数据文件名 */
  chartFileName: string | null
  /** 远程数据文件 ID */
  chartFileId: string | null

  /** 封面图 URL */
  thumbnailUrl: string | null

  // ── Interpretation ──
  /** 图表用途 */
  purpose: string
  /** 中文解读 */
  interpretation: string
  /** 英文翻译 */
  translation: string

  // ── Editor Mode ──
  /** demo: 本地预览模式, remote: 远程同步模式 */
  mode: 'demo' | 'remote'

  // ── Loading Status ──
  /** 全局加载状态 */
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** 错误信息 */
  error: string | null

  // ── Sync Status (remote mode only) ──
  /** 同步状态 */
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error'

  // ── Render Count ──
  /** 渲染次数 */
  renderCount: number
}

// ============================================================
// Editor Actions
// ============================================================

export interface EditorActions {
  // ── Container ──
  /** 图表容器 */
  container: HTMLDivElement | null
  // ── Lifecycle ──
  /** 根据 chartId 初始化编辑器, 自动判断 demo/remote */
  initialize: (chartId: string, container?: HTMLDivElement) => Promise<void>
  /** 重置编辑器状态 */
  reset: () => void

  // ── Config Editing ──
  /** 局部更新 chartConfig, 这是 debounce 版本 */
  updateConfig: (partial: DeepPartial<ChartConfig>) => void
  /** 更新图表名称 */
  updateChartName: (name: string) => void

  // ── File & Data ──
  /** 上传数据文件 (demo mode 会触发创建新图表 + 切换 remote) */
  createNewChart: (file: UploadChartFile) => Promise<string>
  replaceDataFile: (file: UploadChartFile) => Promise<void>

  // ── Chart Rendering ──
  /** 挂载图表到 DOM 容器 (由 UI 层在 mount 时调用) */
  mountChart: () => void
  /** 卸载图表 (由 UI 层在 unmount 时调用) */
  unmountChart: () => void
  /** 导出图表为 base64 图片 */
  exportChartImage: (type: 'svg' | 'png', pixelRatio?: number) => Promise<string>

  // ── Internal ──
  /** 实时局部更新 chartConfig (deep merge) */
  _realTimeUpdateConfig: EditorActions['updateConfig']
}

// ============================================================
// Combined Store Type
// ============================================================

export type EditorStore = EditorState & EditorActions
