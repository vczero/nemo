import type { ChartConfig, ChartType } from '@/chart'
import type {
  TWordSegmentationTaskConfigResponse,
  TWordSegmentationTaskParams,
  TCoOccurrenceTaskParams,
  TSentimentTaskParams,
  TSentimentClassificationTaskParams,
  TTextSummaryTaskParams,
  TTopicOccurrenceTaskParams,
  TNewsClassificationTaskParams,
  TTextClassificationTaskParams,
  TTfIdfTaskConfigResponse,
  TTfIdfTaskParams,
  TDocSimTaskConfigResponse,
  TDocSimTaskParams,
} from '@/apis/ml_task'

export type TaskPhase =
  | 'config'
  | 'submitting'
  | 'loading'
  | 'polling'
  | 'completed'
  | 'failed'

interface MLTaskTypeRegistry {
  SEGMENTATION: {
    config: TWordSegmentationTaskConfigResponse
    params: TWordSegmentationTaskParams
  }
  CO_OCCURRENCE: {
    config: Record<string, unknown>
    params: TCoOccurrenceTaskParams
  }
  SENTIMENT: {
    config: Record<string, unknown>
    params: TSentimentTaskParams
  }
  SENTIMENT_CLASSIFICATION: {
    config: Record<string, unknown>
    params: TSentimentClassificationTaskParams
  }
  TEXT_SUMMARY: {
    config: Record<string, unknown>
    params: TTextSummaryTaskParams
  }
  TOPIC_OCCURRENCE: {
    config: Record<string, unknown>
    params: TTopicOccurrenceTaskParams
  }
  NEWS_CLASSIFICATION: {
    config: Record<string, unknown>
    params: TNewsClassificationTaskParams
  }
  TEXT_CLASSIFICATION: {
    config: Record<string, unknown>
    params: TTextClassificationTaskParams
  }
  TF_IDF: {
    config: TTfIdfTaskConfigResponse
    params: TTfIdfTaskParams
  }
  DOC_SIM: {
    config: TDocSimTaskConfigResponse
    params: TDocSimTaskParams
  }
}

interface MLTaskTypeFallback {
  config: Record<string, unknown>
  params: Record<string, unknown>
}

/** Resolve config type for a given task type string */
export type MLTaskConfig<T extends string> =
  T extends keyof MLTaskTypeRegistry
    ? MLTaskTypeRegistry[T]['config']
    : MLTaskTypeFallback['config']

/** Resolve task params type for a given task type string */
export type MLTaskParams<T extends string> =
  T extends keyof MLTaskTypeRegistry
    ? MLTaskTypeRegistry[T]['params']
    : MLTaskTypeFallback['params']

/** Each ML app defines an array of these to describe its report charts */
export interface ReportChartDefinition {
  /** Unique key for this chart within the report, e.g. 'wordcloud' */
  key: string
  /** Display name shown in the chart card header */
  chartName: string
  chartType: ChartType
  /** Generate the default ChartConfig for this chart from the transformed data */
  getDefaultConfig: (data: unknown[][]) => ChartConfig
}

/** Runtime state for a single report chart */
export interface ReportChartState {
  status: 'pending' | 'creating' | 'ready' | 'error'
  chartId: string | null
  chartConfig: ChartConfig | null
  chartData: unknown[][] | null
  error?: string
}

/** Defines a table output file to download and parse */
export interface ReportTableDefinition {
  /** Key matching outputFile.name, e.g. 'table' */
  key: string
}

/** Runtime state for a single report table */
export interface ReportTableState {
  status: 'pending' | 'loading' | 'ready' | 'error'
  data: Record<string, unknown>[]
  error?: string
}

/** Combined report definition for a task type */
export interface ReportDefinition {
  charts: ReportChartDefinition[]
  tables: ReportTableDefinition[]
}
