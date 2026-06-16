import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Result, Spin } from 'antd'
import { getStoryByDoi, type TStoryDetail } from '@/apis'
import StoryReport from '../Storytelling/components/StoryReport'
import { getLocalStorageItem, removeLocalStorageItem } from '@/utils/utils'

export default function ShareData() {
  const [params] = useSearchParams()
  const doi = params.get('doi') || ''
  const draftId = params.get('draft_id') || ''
  const shouldPrint = params.get('print') === '1'
  const [loading, setLoading] = useState(!!doi || !!draftId)
  const [detail, setDetail] = useState<TStoryDetail | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (draftId) {
      try {
        const raw = getLocalStorageItem<TStoryDetail>(`story_draft_${draftId}`)
        if (!raw) {
          setFetchError('草稿数据不存在或已失效')
        } else {
          setDetail({
            ...(raw as TStoryDetail),
            createTime: raw.createTime || Date.now(),
            status: 'DRAFT',
            storyId: '',
            charts: raw.charts || [],
          })

          setTimeout(() => {
            removeLocalStorageItem(`story_draft_${draftId}`)
          }, 100)
        }
      } catch (e) {
        setFetchError((e as Error).message)
      } finally {
        setLoading(false)
      }
      return
    }
    if (!doi) return
    let cancelled = false
    getStoryByDoi(doi)
      .then((d) => !cancelled && setDetail(d))
      .catch((e) => !cancelled && setFetchError((e as Error).message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [doi, draftId])

  useEffect(() => {
    if (!shouldPrint || !detail) return
    let cancelled = false
    const waitReady = async () => {
      if (document.fonts?.ready) await document.fonts.ready
      const imgs = Array.from(document.images)
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = img.onerror = () => resolve()
              })
        )
      )
    }
    waitReady().then(() => {
      if (cancelled) return
      setTimeout(() => window.print(), 200)
    })
    return () => {
      cancelled = true
    }
  }, [shouldPrint, detail])

  const error = !doi && !draftId ? '分享链接缺少 doi 参数' : fetchError

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <Spin size="large" />
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
        <Result
          status="404"
          title="无法访问"
          subTitle={error || '报告不存在'}
        />
      </div>
    )
  }

  return (
    <div
      className="mx-auto min-h-screen w-full max-w-4xl bg-gray-50 p-4 print:min-h-0 print:max-w-none print:bg-white print:p-0"
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      <StoryReport
        title={detail.title}
        author={detail.author}
        description={detail.description}
        createTime={detail.createTime}
        charts={detail.charts}
      />
    </div>
  )
}
