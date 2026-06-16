import { useState, useRef, useCallback, useEffect } from 'react'
import { Button, Drawer, App, Input } from 'antd'
import {
  RobotOutlined,
  SyncOutlined,
  LoadingOutlined,
  CopyOutlined,
  BulbOutlined,
} from '@ant-design/icons'
import { useEditorStore } from '@/chart'
import { fetcher } from '@/utils/fetcher'
import { copyToClipboard } from '@/utils/utils'
import {
  CHART_INTERPRET_ENDPOINT,
  CHART_INTERPRET_TRANSLATE_ENDPOINT,
} from '@/apis/endpoints'

export default function ChartInterpretPanel({
  open,
  onClose,
  getContainer,
}: {
  open: boolean
  onClose: () => void
  getContainer: HTMLElement
}) {
  const { message } = App.useApp()
  const chartId = useEditorStore((s) => s.chartId)
  const storePurpose = useEditorStore((s) => s.purpose)
  const storeInterpretation = useEditorStore((s) => s.interpretation)
  const storeTranslation = useEditorStore((s) => s.translation)

  const [purpose, setPurpose] = useState('')
  const [interpretation, setInterpretation] = useState('')
  const [translation, setTranslation] = useState('')
  const [isInterpreting, setIsInterpreting] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [interpretError, setInterpretError] = useState('')
  const [translateError, setTranslateError] = useState('')
  const [hasExistingData, setHasExistingData] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const interpretScrollRef = useRef<HTMLDivElement>(null)
  const translateScrollRef = useRef<HTMLDivElement>(null)

  // 从 store 同步已有的解读数据
  useEffect(() => {
    if (storePurpose && !purpose) setPurpose(storePurpose)
    if (storeInterpretation && !interpretation) {
      setInterpretation(storeInterpretation)
      setTranslation(storeTranslation)
      setHasExistingData(true)
    }
  }, [storePurpose, storeInterpretation, storeTranslation])

  const runInterpret = useCallback(async () => {
    if (!chartId) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setInterpretation('')
    setTranslation('')
    setInterpretError('')
    setTranslateError('')
    setIsInterpreting(true)
    setIsTranslating(true)

    const parseErrorMessage = (content: string, fallback: string) => {
      try {
        const errorObj = JSON.parse(content)
        return errorObj.errorMessage || fallback
      } catch {
        return fallback
      }
    }

    try {
      await fetcher(CHART_INTERPRET_ENDPOINT(chartId), {
        method: 'POST',
        body: { purpose },
        signal: controller.signal,
        fetcherOptions: {
          responseType: 'eventStream',
          onChunk: (chunk) => {
            if (chunk?.type === 'DELTA_TEXT') {
              const content = chunk?.content || ''
              setInterpretation((prev) => prev + content)
            }
            if (chunk?.type === 'ERROR') {
              const content = chunk?.content || ''
              console.error('[ChartInterpretPanel] error:', content)
              const errMsg =
                '图表解读失败，' + parseErrorMessage(content, '请稍后重试')
              setInterpretError(errMsg)
              setTranslateError(errMsg)
              message.error(errMsg)
              controller.abort()
            }
          },
        },
      })

      setIsInterpreting(false)

      await new Promise((resolve) => setTimeout(resolve, 100))
      if (controller.signal.aborted) return

      await fetcher(CHART_INTERPRET_TRANSLATE_ENDPOINT(chartId), {
        method: 'POST',
        signal: controller.signal,
        fetcherOptions: {
          responseType: 'eventStream' ,
          onChunk: (chunk) => {
            if (chunk?.type === 'DELTA_TEXT') {
              const content = chunk?.content || ''
              setTranslation((prev) => prev + content)
            }
            if (chunk?.type === 'ERROR') {
              const content = chunk?.content || ''
              console.error('[ChartInterpretPanel] error:', content)
              const errMsg =
                '图表翻译失败，' + parseErrorMessage(content, '请稍后重试')
              setTranslateError(errMsg)
              message.error(errMsg)
              controller.abort()
            }
          },
        },
      })
      setHasExistingData(true)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[ChartInterpretPanel] error:', error)
        const errMsg = (error as Error).message || '请求失败，请稍后重试'
        if (!interpretError) {
          setInterpretError(errMsg)
        }
      }
    } finally {
      setIsInterpreting(false)
      setIsTranslating(false)
    }
  }, [chartId, purpose])

  // 流式内容变化时自动滚到底部
  useEffect(() => {
    if (interpretScrollRef.current) {
      interpretScrollRef.current.scrollTop =
        interpretScrollRef.current.scrollHeight
    }
  }, [interpretation])

  useEffect(() => {
    if (translateScrollRef.current) {
      translateScrollRef.current.scrollTop =
        translateScrollRef.current.scrollHeight
    }
  }, [translation])

  const loading = isInterpreting || isTranslating

  const handleCopy = useCallback(
    (text: string) => {
      copyToClipboard(text).then(() => {
        message.success('已复制到剪贴板')
      })
    },
    [message]
  )

  const title = (
    <div className="flex items-center gap-2 text-blue-600">
      <RobotOutlined />
      <span className="text-sm font-medium">
        以下内容由大模型进行解读，仅供参考
      </span>
    </div>
  )

  return (
    <Drawer
      title={title}
      placement="bottom"
      size={400}
      open={open}
      onClose={onClose}
      mask={false}
      getContainer={getContainer}
      styles={{
        root: { position: 'absolute' },
        body: { padding: 0, display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* 图表用途输入 */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="mb-1 text-sm font-medium text-gray-700">
          请输入图表用途 <span className="text-red-500">*</span>
        </div>
        <div className="flex items-start gap-2">
          <Input
            className="flex-1"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="请输入图表的用途，例如，这是某某公司用来评价一线城市的消费性指标..."
            disabled={loading}
          />
          <Button
            type="primary"
            icon={hasExistingData ? <SyncOutlined /> : <BulbOutlined />}
            disabled={loading || !purpose.trim()}
            onClick={runInterpret}
          >
            {hasExistingData ? '重新解读' : '开始解读'}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="relative flex-1">
          <div
            ref={interpretScrollRef}
            className="h-full overflow-y-auto p-4 pr-8"
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {interpretation ||
                (!loading && !interpretError && (
                  <span className="text-gray-400">暂无解读内容</span>
                ))}
              {isInterpreting && (
                <LoadingOutlined className="ml-1 text-blue-500" />
              )}
              {interpretError && (
                <div className="mt-2 text-sm text-red-500">
                  {interpretError}
                </div>
              )}
            </div>
          </div>
          {interpretation && !isInterpreting && (
            <Button
              type="text"
              size="small"
              className="absolute right-2 top-2 text-gray-400"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(interpretation)}
            />
          )}
        </div>

        <div className="w-px shrink-0 bg-gray-200" />

        <div className="relative flex-1">
          <div
            ref={translateScrollRef}
            className="h-full overflow-y-auto p-4 pr-8"
          >
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-500">
              {translation ||
                (!loading && !isInterpreting && !translateError && (
                  <span className="text-gray-300">No interpretation available</span>
                ))}
              {isTranslating && (
                <LoadingOutlined className="ml-1 text-blue-500" />
              )}
              {translateError && (
                <div className="mt-2 text-sm text-red-500">
                  {translateError}
                </div>
              )}
            </div>
          </div>
          {translation && !isTranslating && (
            <Button
              type="text"
              size="small"
              className="absolute right-2 top-2 text-gray-400"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(translation)}
            />
          )}
        </div>
      </div>
    </Drawer>
  )
}
