import { fetcher, type TFetcherOptions } from '@/utils/fetcher'
import type { TTaskType, TTaskStatus } from '@/constants/ml_task'

import {
  GET_ML_TASK_CONFIG_ENDPOINT,
  GET_ML_TASK_LIST_ENDPOINT,
  GET_ML_TASK_RESULT_ENDPOINT,
  SUBMIT_ML_TASK_TASK_ENDPOINT,
  DELETE_ML_TASK_ENDPOINT,
  UPDATE_ML_TASK_NAME_ENDPOINT,
} from './endpoints'
import type { MLTaskConfig, MLTaskParams } from '@/types/mlApp'
import type { TGetChartConfigResponse } from './types'

// ============================================================
// Common types
// ============================================================

export type TTaskFile = {
  createTime?: number
  fileId: string
  fileSize: number
  fileType?: string
  fileUrl: string
  name: string
}

export type TInputFile = {
  /** Uploaded file id */
  id: string
  /** Param key this file maps to (e.g. 'user_data_oss_path') */
  name: string
  /** OSS path of the uploaded file */
  path: string
}

export type TSubmitMLTaskRequest = {
  inputFiles?: TInputFile[]
  taskName?: string
  taskParams?: Record<string, any>
  taskType: TTaskType
}

export type TMLTaskResponse = {
  chartFileId: string
  endTime: number
  errorMessage: string
  inputFileId: string
  inputFiles: TTaskFile[]
  outputFileId: string
  outputFiles: TTaskFile[]
  retryCount: number
  startTime: number
  summary: Record<string, any>
  taskId: string
  taskName: string
  taskParams: Record<string, any>
  taskStatus: TTaskStatus
  taskType: TTaskType
  userId: string
  username: string
}

export type TMLTaskListRequest = {
  businessId?: string
  keyword?: string
  pageNum?: number
  pageSize?: number
}

export type TMLTaskListResponse = {
  list: TMLTaskResponse[]
  pageNum: number
  pageSize: number
  total: number
}

export type TMLTaskResultResponse<T extends TTaskType> = {
  errorMessage: string
  externalTaskId: string
  inputTokenCount: number
  inputFiles: TTaskFile[]
  outputFiles: TTaskFile[]
  charts: TGetChartConfigResponse[]
  outputTokenCount: number
  summary: Record<string, any>
  taskId: string
  taskStatus: TTaskStatus
  tokenCost: number
  taskParams: MLTaskParams<T>
}

// ============================================================
// Per-task-type types
//
// Each task type defines its own config response and task params.
// Register them in types/mlApp.ts MLTaskTypeRegistry.
// ============================================================

// ── Word Segmentation ──

export type TWordSegmentationTaskConfigResponse = {
  seg_model: { name: string }[]
  user_selected_stopword_names: { name: string; count: number }[]
}

export type TWordSegmentationTaskParams = {
  user_selected_stopword_names: string
  seg_model: string
}

// ── Co-Occurrence Network ──

export type TCoOccurrenceTaskParams = {
  min_frequency?: number
  top_n?: number
}

// ── Sentiment Analysis ──

export type TSentimentTaskParams = {
  positive_threshold: number // 都是上界
  neutral_threshold: number
  negative_threshold: number
}

// ── Sentiment Classification ──

export type TSentimentClassificationMode = 'SINGLE_CLASS' | 'MULTI_CLASS'

export type TTextClassificationCategory = {
  category: string
  description: string
}

export type TSentimentClassificationTaskParams = {
  classificationType: TSentimentClassificationMode
  categories: TTextClassificationCategory[]
}

// ── Text Summary ──

export type TTextSummaryTaskParams = {
  purpose: string
  max_length: number
}

// ── Topic Occurrence ──

export type TTopicOccurrenceTaskParams = {
  delimiter: string
}

// ── News Classification ──

export type TNewsClassificationMode = 'SINGLE_CLASS' | 'MULTI_CLASS'


export type TNewsClassificationTaskParams = {
  classificationType: TNewsClassificationMode
  categories: TTextClassificationCategory[]
}

// ── Text Classification ──

export type TTextClassificationMode = 'SINGLE_CLASS' | 'MULTI_CLASS'

export type TTextClassificationTaskParams = {
  classificationType: TTextClassificationMode
  categories: TTextClassificationCategory[]
}

// ── TF-IDF ──

export type TTfIdfTaskConfigResponse = {
  user_selected_stopword_names: { name: string; count: number }[]
}

export type TTfIdfTaskParams = {
  user_selected_stopword_names: string
  top_n: number
}

// ── Document Similarity ──

export type TDocSimTaskConfigResponse = {
  user_selected_stopword_names: { name: string; count: number }[]
}

export type TDocSimTaskParams = {
  user_selected_stopword_names: string
}

// ============================================================
// API Functions
//
// These are untyped at the API layer. Type safety is provided
// by the MLTaskTypeRegistry in types/mlApp.ts, resolved through
// useMLAppTask<T> hook.
// ============================================================

export const getMLTaskConfig = async (taskType: TTaskType) => {
  return fetcher<MLTaskConfig<TTaskType> | null>(GET_ML_TASK_CONFIG_ENDPOINT, {
    method: 'GET',
    params: { taskType },
  })
}

export const submitMLTask = async (request: TSubmitMLTaskRequest) => {
  return fetcher<TMLTaskResponse>(SUBMIT_ML_TASK_TASK_ENDPOINT, {
    method: 'POST',
    body: request,
  })
}

export const getMLTaskList = async (request: TMLTaskListRequest) => {
  return fetcher<TMLTaskListResponse>(GET_ML_TASK_LIST_ENDPOINT, {
    method: 'GET',
    params: request,
  })
}

export const getMLTaskResult = async <T extends TTaskType>(taskId: string, options: TFetcherOptions = {}) => {
  return fetcher<TMLTaskResultResponse<T>>(GET_ML_TASK_RESULT_ENDPOINT(taskId), {
    method: 'GET',
    ...options,
  })
}

export const updateMLTaskName = async (taskId: string, taskName: string) => {
  return fetcher<void>(UPDATE_ML_TASK_NAME_ENDPOINT(taskId), {
    method: 'POST',
    body: { taskName },
  })
}

export const deleteMLTask = async (taskId: string) => {
  return fetcher<void>(DELETE_ML_TASK_ENDPOINT(taskId), {
    method: 'POST',
  })
}
