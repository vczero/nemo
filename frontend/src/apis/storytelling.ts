import { fetcher } from '@/utils/fetcher'
import type {
  ChartConfig } from '@/chart/types'

// ============================================================
// Endpoints (mocked, kept here for reference / future backend)
// ============================================================
export const GET_STORY_LIST_ENDPOINT = '/api/stories/page'
export const CREATE_STORY_ENDPOINT = '/api/stories/add'
export const UPDATE_STORY_ENDPOINT = (id: string) =>
  `/api/stories/${id}/update`
export const DELETE_STORY_ENDPOINT = (id: string) =>
  `/api/stories/${id}/delete`
export const GET_STORY_DETAIL_ENDPOINT = (id: string) =>
  `/api/stories/${id}/get`
export const GET_STORY_BY_DOI_ENDPOINT = '/api/storytelling/share'
export const SEARCH_CHARTS_ENDPOINT = '/api/charts/search'

// ============================================================
// Types
// ============================================================

export interface TStoryChartItem {
  chartId: string
  chartName?: string
  thumbnailUrl?: string
  description?: string
  sortOrder?: number
}

export interface TStoryItem {
  storyId: string
  title: string
  description?: string
  author?: string
  createTime: number
  updateTime: number
  status?: 'DRAFT' | 'PUBLISHED'
  // /** 分享 doi, 用于 /sharedata?doi=xxx */
  // doi: string
}

export interface TStoryDetail extends TStoryItem {
  charts: TStoryChartItem[]
}

export interface TStoryListRequest {
  pageNum: number
  pageSize: number
}

export interface TStoryListResponse {
  list: TStoryItem[]
  total: number
  pageNum: number
  pageSize: number
}

export interface TCreateStoryRequest {
  title: string
  author?: string
  description?: string
  charts: TStoryChartItem[]
}

export type TCreateStoryResponse = string

export interface TUpdateStoryRequest extends TCreateStoryRequest {
  storyId: string
}

export type TUpdateStoryResponse = void

export const getStoryList = async (
  request: TStoryListRequest
): Promise<TStoryListResponse> => {
  const { pageNum, pageSize } = request
  const res = await fetcher<TStoryListResponse>(GET_STORY_LIST_ENDPOINT, {
    method: 'POST',
    body: {pageNum, pageSize},
  })
  return res
}

export const createStory = async (
  request: TCreateStoryRequest
): Promise<TCreateStoryResponse> => {
  return fetcher<TCreateStoryResponse>(CREATE_STORY_ENDPOINT, {
    method: 'POST',
    body: request,
  })
}

export const updateStory = async (
  request: TUpdateStoryRequest
): Promise<TUpdateStoryResponse> => {
  if (!request.storyId) throw new Error('故事ID不能为空')
  return fetcher<TUpdateStoryResponse>(UPDATE_STORY_ENDPOINT(request.storyId), {
    method: 'POST',
    body: request,
  })
}

export const deleteStory = async (storyId: string): Promise<void> => {
  if (!storyId) throw new Error('故事ID不能为空')
  return fetcher<void>(DELETE_STORY_ENDPOINT(storyId), {
    method: 'POST',
  })
}

export const getStoryDetail = async (
  storyId: string
): Promise<TStoryDetail> => {
  if (!storyId) throw new Error('故事ID不能为空')
  return fetcher<TStoryDetail>(GET_STORY_DETAIL_ENDPOINT(storyId), {
    method: 'GET',
  })
}

export const getStoryByDoi = async (doi: string): Promise<TStoryDetail> => {
  return getStoryDetail(doi)
}
