import { useCallback, useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import { toEChartsOption, type ChartConfig } from '@/chart'
import { dataURLToFile } from '@/chart/utils'
import { fileFetcher } from '@/utils/fetcher'
import { parseFileToTable, parseToJSON, parseToTable } from '@/utils/xlsx'
import { createChart, syncChartWithImage } from '@/apis/func'
import { initEcharts, exportImage } from '@/utils/echarts'
import { sleep } from '@/utils/utils'
import type {
  ReportDefinition,
  ReportChartState,
  ReportTableState,
} from '@/types/mlApp'
import type { TMLTaskResultResponse, TTaskFile } from '@/apis/ml_task'
import type { TGetChartConfigResponse } from '@/apis/types'
import type { TTaskType } from '@/constants/ml_task'
import { usePermission } from '@/components/Permission'
import { PERMISSIONS } from '@/constants/permission'

interface UseReportReturn {
  /** Chart states keyed by definition key */
  charts: Map<string, ReportChartState>
  /** Bind a DOM container for a chart key. Pass as ref callback to the container div. */
  bindRef: (key: string) => (el: HTMLDivElement | null) => void
  /** Table states keyed by definition key */
  tables: Map<string, ReportTableState>
  /** Get the download URL for a named output file */
  getOutputFile: (name: string) => TTaskFile | undefined
}

export function useReport<T extends TTaskType>(
  result: TMLTaskResultResponse<T>,
  definition: ReportDefinition,
): UseReportReturn {
  const { charts: chartDefs, tables: tableDefs } = definition
  const { hasPermission } = usePermission([PERMISSIONS.TASKS])

  // ── Chart state ──
  const [charts, setCharts] = useState<Map<string, ReportChartState>>(() => {
    const initial = new Map<string, ReportChartState>()
    for (const def of chartDefs) {
      initial.set(def.key, {
        status: 'pending',
        chartId: null,
        chartConfig: null,
        chartData: null,
      })
    }
    return initial
  })

  // ── Table state ──
  const [tables, setTables] = useState<Map<string, ReportTableState>>(() => {
    const initial = new Map<string, ReportTableState>()
    for (const def of tableDefs) {
      initial.set(def.key, { status: 'pending', data: [] })
    }
    return initial
  })

  const containerRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const echartsInstances = useRef<Map<string, echarts.EChartsType>>(new Map())
  const resizeObserver = useRef<ResizeObserver | null>(null)
  const pipelineStarted = useRef(false)

  // Lazy-init a shared ResizeObserver
  const getResizeObserver = useCallback(() => {
    if (!resizeObserver.current) {
      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLDivElement
          const instance = echarts.getInstanceByDom(el)
          if (instance) {
            instance.resize()
          }
        }
      })
    }
    return resizeObserver.current
  }, [])

  // Update a single chart state immutably
  const updateChart = useCallback(
    (key: string, patch: Partial<ReportChartState>) => {
      setCharts((prev) => {
        const next = new Map(prev)
        const existing = next.get(key)
        if (existing) {
          next.set(key, { ...existing, ...patch })
        }
        return next
      })
    },
    [],
  )

  // Update a single table state immutably
  const updateTable = useCallback(
    (key: string, patch: Partial<ReportTableState>) => {
      setTables((prev) => {
        const next = new Map(prev)
        const existing = next.get(key)
        if (existing) {
          next.set(key, { ...existing, ...patch })
        }
        return next
      })
    },
    [],
  )

  // Bind ref callback factory — observe/unobserve for resize
  const bindRef = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      const prev = containerRefs.current.get(key)
      if (prev && prev !== el) {
        getResizeObserver().unobserve(prev)
      }
      containerRefs.current.set(key, el)
      if (el) {
        getResizeObserver().observe(el)
      }
    },
    [getResizeObserver],
  )

  // Render a single chart into its container
  const renderChart = useCallback(
    async (key: string, config: ChartConfig, data: unknown[][]) => {
      const container = containerRefs.current.get(key)

      if (!container) return

      const existing = echartsInstances.current.get(key)
      if (existing) {
        existing.dispose()
      }

      const instance = initEcharts(container, config.theme ?? 'academy')
      if (!instance) return

      echartsInstances.current.set(key, instance)

      try {
        const option = await toEChartsOption(config, data)
        instance.setOption(option)
      } catch (err) {
        console.error(`[useReport] render error for "${key}":`, err)
        updateChart(key, {
          status: 'error',
          error: (err as Error).message || '图表渲染失败',
        })
      }
    },
    [updateChart],
  )

  // Get output file metadata by name
  const getOutputFile = useCallback(
    (name: string) => {
      return (result.outputFiles ?? []).find((f) => f.name === name)
    },
    [result.outputFiles],
  )

  // Main pipeline: charts + tables
  useEffect(() => {
    if (pipelineStarted.current) return
    pipelineStarted.current = true

    const outputFiles = result.outputFiles ?? []
    const existingCharts = result.charts ?? []

    // Sync chart thumbnail after rendering
    async function syncThumbnail(key: string, chartId: string) {
      await sleep(500)
      const instance = echartsInstances.current.get(key)
      if (!instance) return
      const dataURL = await exportImage(instance, 'svg')
      const file = dataURLToFile(dataURL, `${key}.svg`)
      if (!file) return
      try {
        await syncChartWithImage({ chartId, chartImage: file })
      } catch (err) {
        console.error(`[useReport] sync thumbnail error for "${key}":`, err)
      }
    }

    // ── Chart pipeline ──
    const chartTasks = chartDefs.map(async (def) => {
      // 优先按 chartConfig.reportKey 匹配
      // 旧数据 reportKey 缺失时回退按 chartConfig.chartType 匹配
      // —— 同一报告内每种图表类型当前都是唯一的
      const existing = existingCharts.find((c) => {
        const cfg = c.chartConfig
        if (!cfg) return false
        if (cfg.reportKey) return cfg.reportKey === def.key
        return cfg.type === def.chartType
      })

      if (existing?.chartConfig && (existing.chartFile?.content || existing.chartFile?.url)) {
        return renderExistingChart(def, existing)
      }

      // 回退: 下载数据 → 生成配置 → 创建图表
      return createNewChart(def, outputFiles)
    })

    async function renderExistingChart(
      def: (typeof chartDefs)[number],
      existing: TGetChartConfigResponse,
    ) {
      updateChart(def.key, { status: 'creating' })
      try {
        // 解析数据: 优先使用内联 content, 回退到 URL 下载
        let chartData: unknown[][] = []
        const { content, url } = existing.chartFile! || {}
        if (content && typeof content === 'string') {
          // base64 编码的文件内容
          const file = dataURLToFile('base64,' + content, existing.chartFile!.fileName)
          chartData = await parseFileToTable(file as File)
        } else if (typeof url === 'string' && url.length > 0) {
          chartData = await fileFetcher(url, parseToTable)
        }

        // 删除 size 让 ECharts 使用容器宽高
        const { size: _, ...configWithoutSize } = existing.chartConfig!
        const chartConfig = configWithoutSize as ChartConfig

        updateChart(def.key, {
          status: 'ready',
          chartId: existing.chartId,
          chartConfig,
          chartData: chartData,
        })

        requestAnimationFrame(async () => {
          renderChart(def.key, chartConfig, chartData)
        })
      } catch (err) {
        console.error(`[useReport] error rendering existing chart "${def.key}":`, err)
        updateChart(def.key, {
          status: 'error',
          error: (err as Error).message,
        })
      }
    }

    async function createNewChart(
      def: (typeof chartDefs)[number],
      files: TTaskFile[],
    ) {
      const outputFile = files.find((f) => f.name === def.key)
      if (!outputFile) {
        updateChart(def.key, {
          status: 'error',
          error: `未找到图表数据文件: ${def.key}`,
        })
        return
      }

      updateChart(def.key, { status: 'creating' })
      try {
        const chartData = await fileFetcher(outputFile.fileUrl, parseToTable)
        const chartConfig = def.getDefaultConfig(chartData)
        chartConfig.reportKey = def.key
        updateChart(def.key, {
          status: 'ready',
          // chartId,
          chartConfig,
          chartData,
        })

        await renderChart(def.key, chartConfig, chartData)

        try {
          if (hasPermission) {
            const chartId = await createChart({
              chartName: def.chartName,
              chartConfig,
              fileId: outputFile.fileId,
              taskId: result.taskId,
            })
            syncThumbnail(def.key, chartId)
            updateChart(def.key, {
              chartId,
            })
          }
        } catch (err) {
          console.error(`[useReport] error creating chart with thumbnail "${def.key}":`, err)
        }
      } catch (err) {
        console.error(`[useReport] error creating chart "${def.key}":`, err)
        updateChart(def.key, {
          status: 'error',
          error: (err as Error).message,
        })
      }
    }

    // ── Table pipeline ──
    const tableTasks = tableDefs.map(async (def) => {
      const outputFile = outputFiles.find((f) => f.name === def.key)
      if (!outputFile) {
        updateTable(def.key, {
          status: 'error',
          error: `未找到表格数据文件: ${def.key}`,
        })
        return
      }

      updateTable(def.key, { status: 'loading' })
      try {
        const data = await fileFetcher<Record<string, unknown>[]>(
          outputFile.fileUrl,
          parseToJSON,
          { fetcherOptions: { silent: true, requiredAuth: false } },
        )
        updateTable(def.key, { status: 'ready', data })
      } catch (err) {
        console.error(`[useReport] error loading table "${def.key}":`, err)
        updateTable(def.key, {
          status: 'error',
          data: [],
          error: (err as Error).message,
        })
      }
    })

    Promise.allSettled([...chartTasks, ...tableTasks])
  }, [result, chartDefs, tableDefs, updateChart, updateTable, renderChart])

  // Cleanup ECharts instances and ResizeObserver on unmount
  useEffect(() => {
    const instances = echartsInstances.current
    const observer = resizeObserver.current
    return () => {
      observer?.disconnect()
      for (const instance of instances.values()) {
        instance.dispose()
      }
      instances.clear()
    }
  }, [])

  return { charts, bindRef, tables, getOutputFile }
}
