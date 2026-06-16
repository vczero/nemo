import type { ECharts } from 'echarts'
import type { EditorState } from './types'
import { toEChartsOption } from './transformer'
import { initEcharts, exportImage } from '@/utils/echarts'

export interface ChartRendererOptions {
  getState: () => EditorState
  flushPendingUpdates: () => void
  cancelPendingUpdates: () => void
}

export class ChartRenderer {
  private _chartInstance: ECharts | null = null
  private _containerEl: HTMLDivElement | null = null
  private _prevTheme: string | undefined = undefined
  private _prevSize: { width: number; height: number } | undefined = undefined
  private _renderTriggered = false

  private readonly _getState: () => EditorState
  private readonly _flushPendingUpdates: () => void
  private readonly _cancelPendingUpdates: () => void
  private _events: Record<string, ((...args: any[]) => void)[]> = {}

  constructor(opts: ChartRendererOptions) {
    this._getState = opts.getState
    this._flushPendingUpdates = opts.flushPendingUpdates
    this._cancelPendingUpdates = opts.cancelPendingUpdates
  }

  async mount(container: HTMLDivElement) {
    const { status, chartConfig } = this._getState()
    this._containerEl = container
    this._prevTheme = chartConfig?.theme

    if (status === 'ready') {
      await this.render()
    }
  }

  on(event: 'finished', callback: () => void) {
    this._events[event] = this._events[event] || []
    this._events[event].push(callback)
  }

  off(event?: string ) {
    if (event) {
      this._events[event] = []
    } else {
      this._events = {} as Record<string, ((...args: any[]) => void)[]>
    }

    this._chartInstance?.off(event)
  }

  unmount() {
    this._cancelPendingUpdates()
    this._chartInstance?.dispose()
    this._chartInstance = null
    this._containerEl = null
    this._prevTheme = undefined
    this._prevSize = undefined
  }

  async render() {
    const { chartConfig, chartData, status } = this._getState()
    if (!chartConfig || !chartData || !this._containerEl || status !== 'ready')
      return

    // TODO: echart 6.0 的 setTheme 有时无法正常渲染, 所以 theme 变化时重建实例
    if (this._chartInstance && this._prevTheme !== chartConfig.theme) {
      this._chartInstance.dispose()
      this._chartInstance = null
    }

    // 创建实例 (首次或 theme 变化后)
    if (!this._chartInstance) {
      this._chartInstance = initEcharts(
        this._containerEl,
        chartConfig.theme || 'academy',
        chartConfig?.size
      )

      this._prevTheme = chartConfig.theme
      this._prevSize = chartConfig?.size

      for (const event of Object.keys(this._events)) {
        for (const callback of this._events[event]) {
          this._chartInstance!.on(event, () => {
            if (this._renderTriggered) {
              callback()
            }
          })
        }
      }
    }

    if (!this._chartInstance) return

    if (
      this._prevSize?.width !== chartConfig?.size?.width ||
      this._prevSize?.height !== chartConfig?.size?.height
    ) {
      this.resize()
      this._prevSize = chartConfig?.size
    }

    try {
      const option = await toEChartsOption(chartConfig, chartData)
      // 防止 render 期间被 unmount
      if (!this._chartInstance) return
      this._renderTriggered = true
      this._chartInstance.setOption(option, true)
    } catch (err) {
      this._renderTriggered = false
      console.error('[ChartRenderer] render error:', err)
    }
  }

  resize() {
    const { chartConfig } = this._getState()
    if (!this._chartInstance) return

    this._chartInstance.resize({
      width: chartConfig?.size?.width ?? 640,
      height: chartConfig?.size?.height ?? 480,
    })
  }

  async exportImage(type: 'svg' | 'png', pixelRatio?: number): Promise<string> {
    if (!this._chartInstance) throw new Error('Chart not initialized')

    this._flushPendingUpdates()

    return await exportImage(this._chartInstance, type, pixelRatio)
  }

  clearRenderTriggered() {
    this._renderTriggered = false
  }

  dispose() {
    this._chartInstance?.dispose()
    this._chartInstance = null
    this._containerEl = null
    this._prevTheme = undefined
    this._prevSize = undefined
  }
}
