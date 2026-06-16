import { createStore } from 'zustand'
import { devtools } from 'zustand/middleware'
import debounce from 'lodash.debounce'

import type { EditorStore, EditorState, DeepPartial } from './types'
import type { ChartConfig } from '../types'
import { syncChartWithImage, createChart, syncChartConfig, getChartDetail } from '@/apis'
import { fileFetcher } from '@/utils/fetcher'
import { parseFileToTable, parseToTable } from '@/utils/xlsx'
import {
  isDemoChartId,
  loadDemoChart,
  getChartDefinition,
  findChartDefinition,
} from './registry'
import type { ChartInstance } from '../types/definition'
import { dataURLToFile, inferDataMapping } from '../utils'
import { ChartRenderer } from './ChartRenderer'

// ============================================================
// Initial State
// ============================================================

const INITIAL_STATE: EditorState = {
  chartId: null,
  chartName: '',
  chartConfig: null,
  chartData: null,
  chartFileUrl: null,
  chartFileName: null,
  chartFileId: null,
  thumbnailUrl: null,
  purpose: '',
  interpretation: '',
  translation: '',

  mode: 'demo',
  status: 'idle',
  error: null,
  syncStatus: 'idle',
  renderCount: 0,
}

// ============================================================
// Store Factory
// ============================================================

export function createEditorStore() {
  let _debouncedUpdateConfig: ReturnType<typeof debounce> | null = null

  return createStore<EditorStore>()(
    devtools(
      (set, get) => {
        _debouncedUpdateConfig = debounce(
          (partial: DeepPartial<ChartConfig>) => {
            get()._realTimeUpdateConfig(partial)
          },
          600
        )

        const syncToServerWithImage = async () => {
          const { chartId, chartName, chartConfig, mode, exportChartImage, renderCount, thumbnailUrl } =
            get()
          if (!chartId || mode !== 'remote') return


          if (renderCount <= 1) {
            console.log(`[EditorStore] render count: ${renderCount}`)

            // 对于第一次渲染, 如果已经存在封面图, 则跳过同步. 主要是为了后端主动创建的图表在第一次渲染时, 自动更新一下封面图.
            if (thumbnailUrl) {
              return
            }
          }

          set({ syncStatus: 'syncing' })

          try {
            let imageFile: File | null = null
            try {
              const usesPng = chartConfig?.type === 'map'
              const imageType = usesPng ? 'png' : 'svg'
              const base64 = await exportChartImage(
                imageType,
                usesPng ? 2 : undefined
              )
              const file = dataURLToFile(base64, `chart.${imageType}`)
              imageFile = file
            } catch (error) {
              console.error('[EditorStore] export chart image error:', error)
            }

            await syncChartWithImage({
              chartId,
              chartName,
              chartConfig: chartConfig ?? undefined,
              chartImage: imageFile ?? undefined,
            })
            set({ syncStatus: 'synced' })
          } catch (error) {
            set({ syncStatus: 'error', error: (error as Error).message })
            console.error('[EditorStore] sync error:', error)
          }
        }

        const syncChartName = async () => {
          const { chartId, chartName, chartConfig, mode } = get()
          if (!chartId || mode !== 'remote') return

          set({ syncStatus: 'syncing' })

          try {
            await syncChartConfig({
              chartId,
              chartName,
              chartConfig: chartConfig ?? undefined,
            })
            set({ syncStatus: 'synced' })
          } catch (error) {
            set({ syncStatus: 'error', error: (error as Error).message })
            console.error('[EditorStore] sync error:', error)
          }
        }

        const renderer = new ChartRenderer({
          getState: () => get(),
          flushPendingUpdates: () => _debouncedUpdateConfig?.flush(),
          cancelPendingUpdates: () => _debouncedUpdateConfig?.cancel(),
        })

        renderer.off()
        // 图表渲染结束后同步最新封面图到后端
        // 力引导图等动画图表每次迭代都会触发 finished, 需要 debounce 避免重复同步
        const debouncedSync = debounce(async () => {
          await syncToServerWithImage()
          renderer.clearRenderTriggered()
        }, 1000, { maxWait: 3000 })
        renderer.on('finished', debouncedSync)

        return {
          ...INITIAL_STATE,

          container: null as HTMLDivElement | null,

          // ════════════════════════════════════════════
          // Lifecycle
          // ════════════════════════════════════════════

          initialize: async (chartId: string, container: HTMLDivElement) => {
            const { chartId: currentChartId, status, mountChart, renderCount } = get()

            if (container) {
              set({ container })
            }

            // 如果当前 store 已加载该 chartId 且数据就绪, 跳过重复拉取
            if (currentChartId === chartId && status === 'ready') {
              return
            }

            const isDemo = isDemoChartId(chartId)
            set({
              ...INITIAL_STATE,
              chartId,
              status: 'loading',
              mode: isDemo ? 'demo' : 'remote',
            })

            try {
              // 1. 加载图表配置
              const chartInfo: ChartInstance = (isDemo
                ? loadDemoChart(chartId)
                : await getChartDetail(chartId)) as unknown as ChartInstance

              ;set({
                chartName: chartInfo.chartName ?? '',
                chartConfig: chartInfo.chartConfig ?? null,
                chartFileUrl: chartInfo.chartFile?.url ?? null,
                chartFileName: chartInfo.chartFile?.fileName ?? null,
                chartFileId: chartInfo.chartFile?.fileId ?? null,
                thumbnailUrl: chartInfo.thumbnailUrl ?? null,
                purpose: chartInfo.purpose ?? '',
                interpretation: chartInfo.interpretContent ?? '',
                translation: chartInfo.interpretContentEn ?? '',
              })

              // 2. 加载数据: 优先使用内联数据, 否则拉取远程文件
              if (chartInfo.chartFile?.content) {
                if (typeof chartInfo.chartFile.content === 'string') {
                  const file = dataURLToFile('base64,'+chartInfo.chartFile.content, chartInfo.chartFile.fileName)
                  set({ chartData: await parseFileToTable(file as File), renderCount: renderCount + 1  })
                } else if (Array.isArray(chartInfo.chartFile.content)) {
                  set({ chartData: chartInfo.chartFile.content, renderCount: renderCount + 1  })
                }
              } else if (chartInfo.chartFile?.url) {
                const data = await fileFetcher(
                  chartInfo.chartFile.url,
                  parseToTable
                )
                set({ chartData: data, renderCount: renderCount + 1 })
              }
              set({ status: 'ready' })
              mountChart()
            } catch (error) {
              set({
                status: 'error',
                error: (error as Error).message,
              })
            }
          },

          reset: () => {
            const { chartConfig } = get()
            _debouncedUpdateConfig?.cancel()
            debouncedSync.cancel()

            renderer.dispose()

            // 调用图表类型的 destroy 回调
            if (chartConfig?.type) {
              findChartDefinition(chartConfig.type)?.destroy?.()
            }

            set(INITIAL_STATE)
          },

          // ════════════════════════════════════════════
          // Config Editing
          // ════════════════════════════════════════════

          updateConfig: (partial: DeepPartial<ChartConfig>) => {
            _debouncedUpdateConfig?.(partial)
          },

          _realTimeUpdateConfig: async (partial: DeepPartial<ChartConfig>) => {
            const { chartConfig, renderCount } = get()
            if (!chartConfig) return
            const newConfig = {
              ...chartConfig,
              ...partial,
              chartSetting: {
                ...chartConfig?.chartSetting,
                ...partial.chartSetting,
              },
            } as ChartConfig
            set({ chartConfig: newConfig, renderCount: renderCount + 1 })

            await renderer.render()
          },

          updateChartName: (name: string) => {
            const { mode } = get()

            set({ chartName: name })

            if (mode === 'remote') {
              syncChartName()
            }
          },

          // ════════════════════════════════════════════
          // File & Data
          // ════════════════════════════════════════════
          createNewChart: async (
            file: Parameters<EditorStore['createNewChart']>[0]
          ) => {
            const {
              mode,
              chartConfig,
              unmountChart,
              mountChart,
            } = get()

            if (mode === 'demo') {
              // Demo → Remote 切换流程

              // 解析文件数据
              const data =
                file.fileContent ??
                (await parseFileToTable(file.originFileObj as File))
              const chartName = file.originFileObj.name
                .split('.')[0]
                .slice(0, 10)

              // 根据新文件数据自动推断 dataMapping (而非重置为空默认值)
              const chartDef = getChartDefinition(chartConfig!.type)
              const inferredMapping = chartDef.inferDataMapping
                ? chartDef.inferDataMapping(data, chartDef.dataMappingMeta)
                : inferDataMapping(data, chartDef.dataMappingMeta)

              const defaultConfig =
                typeof chartDef.defaultConfig === 'function'
                  ? chartDef.defaultConfig(data, inferredMapping)
                  : chartDef.defaultConfig
              const resetConfig = {
                ...defaultConfig,
                dataMapping: inferredMapping,
              } as ChartConfig

              // Step 2: 创建新图表 (使用重置后的 config)
              const newChartId = await createChart({
                chartName: chartName,
                chartConfig: resetConfig as any,
                fileId: file.response.fileId,
              })

              // Step 3: 切换到 remote mode, 同步更新 chartConfig
              // UI 层通过响应 chartId 变化来更新 URL
              unmountChart()
              set({
                chartId: newChartId,
                chartName: chartName,
                mode: 'remote',
                chartData: data,
                chartConfig: resetConfig,
                chartFileUrl: file.response.url,
                chartFileName: file.originFileObj.name,
                chartFileId: file.response.fileId,
                status: 'ready',
                renderCount: 1,
              })

              // 触发重新渲染 & 同步封面图
              await mountChart()

              return newChartId
            }
          },

          /**
           * 替换数据文件
           */
          replaceDataFile: async (
            file: Parameters<EditorStore['createNewChart']>[0]
          ) => {
            const { mode, renderCount } = get()

            if (mode === 'remote') {
              const data =
                file.fileContent ??
                (await parseFileToTable(file.originFileObj as File))

              const updates: Partial<EditorState> = {
                chartData: data,
                chartFileUrl: file.response.url,
                chartFileName: file.originFileObj.name,
                chartFileId: file.response.fileId,
                renderCount: renderCount + 1,
              }

              set(updates)

              await renderer.render()
            } else {
              throw new Error(
                'Only remote mode is supported for uploading data'
              )
            }
          },

          // ════════════════════════════════════════════
          // Chart Rendering (delegated to ChartRenderer)
          // ════════════════════════════════════════════

          mountChart: () => renderer.mount(get().container!),
          unmountChart: () => renderer.unmount(),
          exportChartImage: (type: 'svg' | 'png', pixelRatio?: number) =>
            renderer.exportImage(type, pixelRatio),
        }
      },
      { name: 'EditorStore' }
    )
  )
}
