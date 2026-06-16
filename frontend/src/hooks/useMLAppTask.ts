import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import useSWR from 'swr'
import type { TTaskType, TTaskStatus } from '@/constants/ml_task'
import type { TaskPhase, MLTaskConfig, MLTaskParams } from '@/types/mlApp'
import {
  getMLTaskConfig,
  getMLTaskResult,
  submitMLTask,
  type TInputFile,
  type TMLTaskResponse,
  type TMLTaskResultResponse,
} from '@/apis/ml_task'
import { TASK_STATUS } from '@/constants/ml_task'
import { getTaskRegistry } from '@/routes/Task/registry'
import { messageApi } from '@/utils/globalMessage'

// ============================================================
// Types
// ============================================================

interface UseMLAppTaskOptions {
  /** Polling interval in ms when task is running. Default 3000. */
  pollingInterval?: number
}

interface UseMLAppTaskReturn<T extends TTaskType> {
  /** Current lifecycle phase */
  phase: TaskPhase
  /** Current task ID (from URL) */
  taskId: string | null

  /** App config fetched from backend (available in config phase) */
  config: MLTaskConfig<T> | null

  /** Config error */
  configError: Error | null

  /**
   * Submit a new task.
   * `taskParams` is strongly typed per task type via MLTaskTypeRegistry.
   */
  submitTask: (params: {
    inputFiles?: TInputFile[]
    taskName?: string
    taskParams?: MLTaskParams<T>
  }) => Promise<string | null>

  /** Task entity returned after submission */
  task: TMLTaskResponse | null
  /** Task result (available when completed) */
  result: TMLTaskResultResponse<T> | null
  /** Current task status from polling */
  taskStatus: TTaskStatus | null
  /** Error message if failed */
  error: string | null
  /** Reset to config phase (clear taskId from URL) */
  startNewTask: () => void
}

// ============================================================
// Hook
// ============================================================

export function useMLAppTask<T extends TTaskType>(
  taskType: T,
  options: UseMLAppTaskOptions = {},
): UseMLAppTaskReturn<T> {
  const { pollingInterval = 10000 } = options

  const [searchParams, setSearchParams] = useSearchParams()
  const taskId = searchParams.get('taskId')
  const registry = getTaskRegistry(taskType)

  // Internal state — phase is derived from these
  const [phase, setPhase] = useState<TaskPhase>('loading')
  const [submitting, setSubmitting] = useState(false)
  const [task, setTask] = useState<TMLTaskResponse | null>(null)
  const [result, setResult] = useState<TMLTaskResultResponse<T> | null>(null)
  const [taskStatus, setTaskStatus] = useState<TTaskStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const isSubmitRef = useRef(false)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollFailCountRef = useRef(0)

  // ── Derive phase from state (no setState in effects) ──
  useEffect(() => {
    const _phase = () => {
      if (submitting) return 'submitting'
      if (initialLoading) return 'loading'
      if (!taskId) return 'config'
      if (result && taskStatus === TASK_STATUS.SUCCESS) return 'completed'
      if (error) return 'failed'
      return 'polling'
    }

    setPhase(_phase())
  }, [taskId, submitting, initialLoading, result, taskStatus, error])

  // ── Config fetching (only when no taskId) ──
  const { data: config, error: configError } = useSWR(
    !taskId && !!registry ? ['ml-task-config', taskType] : null,
    () => getMLTaskConfig(taskType).finally(() => { setInitialLoading(false); }),
    { revalidateOnFocus: false },
  )

  // ── Reset state when taskId is cleared (React recommended pattern) ──
  const [prevTaskId, setPrevTaskId] = useState<string | null>(taskId)
  if (prevTaskId !== taskId) {
    setPrevTaskId(taskId)
    if (!taskId) {
      setResult(null)
      setTask(null)
      setTaskStatus(null)
      setError(null)
      setInitialLoading(true)
    } else if (!isSubmitRef.current) {
      setInitialLoading(true)
    }
    isSubmitRef.current = false
  }

  // ── Polling logic ──
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const startPolling = useCallback(
    (id: string) => {
      stopPolling()
      pollFailCountRef.current = 0

      const poll = async () => {
        try {
          const res = await getMLTaskResult<T>(id, { fetcherOptions: { silent: true } })
          pollFailCountRef.current = 0
          setInitialLoading(false)
          setTaskStatus(res.taskStatus)

          if (res.taskStatus === TASK_STATUS.SUCCESS) {
            stopPolling()
            setResult(res)
          } else if (res.taskStatus === TASK_STATUS.FAILED) {
            stopPolling()
            setError(res.errorMessage || '任务执行失败')
          } else if (res.taskStatus === TASK_STATUS.CANCELLED) {
            stopPolling()
            setError('任务已取消')
          }
        } catch (err) {
          pollFailCountRef.current += 1
          console.error(`[useMLAppTask] polling error (${pollFailCountRef.current}/3):`, err)
          if (pollFailCountRef.current >= 3) {
            stopPolling()
            setInitialLoading(false)
            const msg = (err as Error).message || '网络请求失败，请稍后刷新重试'
            setError(msg)
          }
        }
      }

      poll()
      pollingRef.current = setInterval(poll, pollingInterval)
    },
    [pollingInterval, stopPolling],
  )

  // Start polling when entering page with taskId (and no result yet)
  useEffect(() => {
    if (taskId && !result && !error) {
      startPolling(taskId)
    }
    return stopPolling
  }, [taskId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit task ──
  const submitTask = useCallback(
    async (params: {
      inputFiles?: TInputFile[]
      taskName?: string
      taskParams?: MLTaskParams<T>
    }): Promise<string | null> => {
      setSubmitting(true)
      setError(null)

      try {
        const res = await submitMLTask({
          taskType,
          inputFiles: params.inputFiles,
          taskName: params.taskName,
          taskParams: params.taskParams,
        })

        setTask(res)
        const newTaskId = res.taskId

        isSubmitRef.current = true
        setSearchParams({ taskType, taskId: newTaskId }, { replace: true })
        setSubmitting(false)
        startPolling(newTaskId)

        return newTaskId
      } catch (err) {
        const msg = (err as Error).message || '提交任务失败'
        setError(msg)
        setSubmitting(false)
        messageApi.error(msg)
        return null
      }
    },
    [taskType, setSearchParams, startPolling],
  )

  // ── Start new task ──
  const startNewTask = useCallback(() => {
    stopPolling()
    setSearchParams({ taskType })
  }, [stopPolling, setSearchParams])

  return {
    phase,
    taskId,
    config: config as MLTaskConfig<T> | null,
    configError,
    submitTask,
    task,
    result,
    taskStatus,
    error,
    startNewTask,
  }
}
