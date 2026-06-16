import { sleep } from './utils'
import { Stream } from 'openai/streaming'
import { messageApi } from './globalMessage'

export type TFetcherConfig = {
  silent?: boolean
  requiredAuth?: boolean
  responseType?: 'json' | 'arrayBuffer' | 'eventStream'
  onChunk?: (chunk: any) => void
  /** 失败时的重试次数（不含首次请求），默认 0；4xx 错误不会重试 */
  retry?: number
  /** 重试间隔（毫秒），默认 300，会按尝试次数线性增长 */
  retryDelay?: number
}

export type TFetcherOptions = Omit<RequestInit, 'body'> & {
  body?: Record<string, any> | RequestInit['body']
  params?: Record<string, any>
  fetcherOptions?: TFetcherConfig
}

const HTTP_STATUS_ERROR_MESSAGE = {
  404: '未找到资源, 请检查 URL 是否正确',
  403: '无权限访问, 请重新登录',
  401: '未授权, 请重新登录',
  400: '请求错误, 请稍后重试',
  500: '服务器内部错误, 请稍后重试',
  502: '网关错误, 请稍后重试',
  503: '服务不可用, 请稍后重试',
  504: '网关超时, 请稍后重试',
}

export class FetchError extends Error {
  status: number
  info: any
  constructor(message: string, status: number, info: any) {
    super(message)
    this.status = status
    this.info = info
  }
}

/**
 * A generic fetcher function for SWR.
 * It handles basic HTTP fetching, error handling, and JSON parsing.
 *
 * @param {string} url - The URL to fetch.
 * @throws {Error} If the network response is not ok.
 * @returns {Promise<T | Error>} The JSON response from the API.
 */
export const fetcher = async <T>(
  url: string,
  opts: TFetcherOptions = {},
): Promise<T> => {
  const { fetcherOptions = {}, ...restOpts } = opts
  if (
    restOpts.body &&
    typeof restOpts.body === 'object' &&
    Object.prototype.toString.call(restOpts.body) === '[object Object]'
  ) {
    restOpts.body = JSON.stringify(restOpts.body)
    restOpts.headers = {
      ...(restOpts.headers || {}),
      'Content-Type': 'application/json',
    }
  }

  if (
    restOpts.params &&
    typeof restOpts.params === 'object' &&
    Object.prototype.toString.call(restOpts.params) === '[object Object]'
  ) {
    const searchParams = new URLSearchParams()
    Object.entries(restOpts.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value))
      }
    })
    url += `?${searchParams.toString()}`
  }
  const requiredAuth = fetcherOptions.requiredAuth ?? true
  const silent = !!fetcherOptions.silent
  const responseType = fetcherOptions.responseType || 'json'
  const onChunk = fetcherOptions.onChunk
  const retry = Math.max(0, fetcherOptions.retry ?? 0)
  const retryDelay = fetcherOptions.retryDelay ?? 300
  const totalAttempts = retry + 1
  let lastError: FetchError | undefined
  for (let attempt = 0; attempt < totalAttempts; attempt++) {
    const isLastAttempt = attempt === totalAttempts - 1
    try {
      const res = await fetch(url, restOpts as RequestInit)

      if (!res.ok) {
        const defaultMessage =
          HTTP_STATUS_ERROR_MESSAGE[
            res.status as keyof typeof HTTP_STATUS_ERROR_MESSAGE
          ] || '网络请求失败, 请稍后重试'
        let data
        try {
          data = await res.json()
        } catch {
          throw new FetchError(defaultMessage, res.status, defaultMessage)
        }

        throw new FetchError(
          data.error || data.message || defaultMessage,
          res.status,
          data
        )
      }

      if (responseType === 'arrayBuffer') {
        const buffer = await res.arrayBuffer()
        return buffer as unknown as T
      }

      if (responseType === 'eventStream') {
        const stream = Stream.fromSSEResponse(res, new AbortController())
        for await (const event of stream) {
          onChunk?.(event)
        }
        return undefined as unknown as T
      }

      const data = await res.json()
      if (data.success) {
        return data.value as T
      } else {
        if (data.code === 'NO_SUBSCRIPTION') {
          throw new FetchError(
            '您当前的套餐不支持此功能，请升级套餐',
            res.status,
            data
          )
        }
      }

      throw new FetchError(
        data.error || data.message || '网络请求失败, 请稍后重试',
        res.status,
        data
      )
    } catch (error: unknown) {
      const netError: FetchError =
        error instanceof FetchError
          ? error
          : new FetchError('网络请求失败, 请稍后重试', 500, error as any)
      lastError = netError

      // 4xx 是确定性错误（鉴权 / 参数 / 业务规则），重试不会改变结果
      const retryable =
        !(netError.status >= 400 && netError.status < 500) &&
        netError.status !== 0

      if (!isLastAttempt && retryable) {
        await sleep(retryDelay * (attempt + 1))
        continue
      }

      console.error('[Fetcher] error:', error)

      if (!silent) {
        messageApi.error(netError.message)
      }

      if (requiredAuth && netError.status === 401) {
        messageApi.error('登录已过期，请重新登录')
        setTimeout(() => {
          window.location.href = '/signin'
        }, 500)
      }
      throw netError
    }
  }

  // 理论上不可达：循环要么返回，要么在最后一次尝试中抛出。
  throw lastError ?? new FetchError('网络请求失败, 请稍后重试', 500, null)
}

/**
 * 通用文件/数据获取函数
 * @param url - 请求地址
 * @returns Promise<T> - 返回 ArrayBuffer 类型的数据
 */
export const fileFetcher = async <T = any>(
  url: string,
  fileHandler: (data: ArrayBuffer) => Promise<T> = async (data: ArrayBuffer) =>
    data as unknown as T,
  opts: TFetcherOptions = {}
): Promise<T> => {
  if (import.meta.env.DEV) {
    if (url.indexOf('aliyun') > -1) {
      const newURL = new URL(url)
      newURL.host = location.host
      newURL.protocol = 'http'
      newURL.pathname = '/oss-proxy' + newURL.pathname
      url = newURL.toString()
    }
  }

  const buffer = await fetcher<ArrayBuffer>(url, {
    ...opts,
    fetcherOptions: {
      ...(opts.fetcherOptions || {}),
      responseType: 'arrayBuffer',
    },
  })

  try {
    return fileHandler(buffer)
  } catch (error) {
    console.error(error)
    const message = `文件解析失败: ${(error as Error).message}`
    messageApi.error(message)
    throw new Error(message)
  }
}
