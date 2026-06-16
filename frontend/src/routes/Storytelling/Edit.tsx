import { useEffect, useMemo, useState, useRef } from 'react'
import {
  Button,
  Form,
  Input,
  Select,
  Space,
  App,
  Spin,
  Typography,
  Skeleton,
} from 'antd'
import {
  ReadOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  EyeOutlined,
  GlobalOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router'
import { useDebounce, useMeasure } from 'react-use'
import {
  createStory,
  updateStory,
  getStoryDetail,
  getMyCharts,
  getChartDetail,
  type TStoryChartItem,
  type TGetAllMyChartsResponse,
} from '@/apis'
import ContentWrapper from '@/components/ContentWrapper'
import PreviewDrawer from './components/PreviewDrawer'
import { setLocalStorageItem } from '@/utils/utils'
import { SUBSCRIPTION_PERMISSION_GROUPS } from '@/constants/permission'

const { Text } = Typography

/** 内容区宽度阈值: 大于该值时预览面板内联展示, 否则使用侧滑抽屉 */
const INLINE_PREVIEW_BREAKPOINT = 1555

export default function StorytellingEdit() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const storyId = searchParams.get('id') || ''
  const isEdit = !!storyId
  const { message } = App.useApp()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [charts, _setCharts] = useState<TStoryChartItem[]>([])
  const chartsRef = useRef<TStoryChartItem[]>(charts)
  const setCharts = (
    newCharts:
      | TStoryChartItem[]
      | ((prev: TStoryChartItem[]) => TStoryChartItem[])
  ) => {
    const next =
      typeof newCharts === 'function' ? newCharts(chartsRef.current) : newCharts
    _setCharts(next)
    chartsRef.current = next
  }

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  // 图表搜索
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchOptions, setSearchOptions] = useState<
    TGetAllMyChartsResponse['list']
  >([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedChartId, setSelectedChartId] = useState<string | undefined>()

  const [containerRef, { width: containerWidth }] = useMeasure<HTMLDivElement>()
  const inlinePreview = containerWidth >= INLINE_PREVIEW_BREAKPOINT

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    setLoading(true)
    getStoryDetail(storyId)
      .then((detail) => {
        if (cancelled) return
        setTitle(detail.title)
        setAuthor(detail.author || '')
        setDescription(detail.description || '')
        setCharts(
          detail.charts.map((item) => {
            delete item.sortOrder
            return item
          })
        )
      })
      .catch((e) => message.error((e as Error).message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [isEdit, storyId, message])

  useDebounce(
    () => {
      let cancelled = false
      setSearchLoading(true)
      getMyCharts({ keyword: searchKeyword, pageSize: 30, pageNum: 1 })
        .then((res) => !cancelled && setSearchOptions(res.list))
        .finally(() => !cancelled && setSearchLoading(false))
      return () => {
        cancelled = true
      }
    },
    500,
    [searchKeyword]
  )

  const selectOptions = useMemo(() => {
    const selected = new Set(chartsRef.current.map((c) => c.chartId))
    return searchOptions.map((c) => ({
      value: c.chartId,
      disabled: selected.has(c.chartId),
      label: (
        <div className="flex items-center justify-between gap-2">
          <span className="truncate">{c.chartName || '未命名图表'}</span>
          <Text type="secondary" className="shrink-0 text-xs">
            {c.chartId}
          </Text>
        </div>
      ),
      raw: c,
    }))
  }, [searchOptions, charts])

  const handleAddChart = async () => {
    if (!selectedChartId) {
      message.warning('请先选择一个图表')
      return
    }
    if (charts.some((c) => c.chartId === selectedChartId)) {
      message.warning('该图表已添加')
      return
    }
    const picked = searchOptions.find((c) => c.chartId === selectedChartId)
    try {
      const detail = await getChartDetail({
        chartId: selectedChartId,
        withChartFile: false,
        withChartConfig: false,
      })
      const item = {
        chartId: selectedChartId,
        chartName: detail.chartName || picked?.chartName || '',
        thumbnailUrl: detail.thumbnailUrl || '',
        description: detail.interpretContent || '',
      }
      setCharts((prev) => {
        const newCharts = [...prev, item]
        return newCharts
      })
      setSelectedChartId(undefined)
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  const handleMove = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= charts.length) return
    const next = [...charts]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setCharts(next)
  }

  const handleRemove = (idx: number) => {
    setCharts((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleChangeDescription = (idx: number, value: string) => {
    setCharts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, description: value } : c))
    )
  }

  const persist = async () => {
    if (!title.trim()) {
      message.warning('请填写报告标题')
      return null
    }
    if (charts.length === 0) {
      message.warning('请至少添加一个图表')
      return null
    }
    setSaving(true)
    try {
      if (isEdit) {
        await updateStory({ storyId, title, author, description, charts })
        message.success('保存成功')
        return storyId
      } else {
        const res = await createStory({ title, author, description, charts })
        message.success('创建成功')
        return res
      }
    } catch (e) {
      message.error((e as Error).message)
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleOpenOfficial = async () => {
    const res = await persist()
    if (!res) return
    navigate(`/sharedata?doi=${res}`, { replace: true })
  }

  const handleDownloadPdf = () => {
    if (!title.trim()) {
      message.warning('请填写报告标题')
      return
    }
    if (charts.length === 0) {
      message.warning('请至少添加一个图表')
      return
    }
    const draftId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}_${Math.random().toString(36).slice(2)}`
    try {
      setLocalStorageItem(`story_draft_${draftId}`, {
        title,
        author,
        description,
        charts,
        createTime: Date.now(),
      })
      setTimeout(() => {
        window.open(`/sharedata?draft_id=${draftId}&print=1`, '_blank')
      }, 100)
    } catch (e) {
      message.error('草稿暂存失败: ' + (e as Error).message)
      return
    }
  }

  const editorCard = (
    <div className="">
      <div className="mb-6 text-center">
        <Typography.Title level={4} style={{ margin: 0 }}>
          {isEdit ? '编辑研究报告' : '创建研究报告'}
        </Typography.Title>
        <p className="mt-2 text-sm text-gray-500">
          通过添加图表 ID，快速组合生成 Storytelling 报告
        </p>
      </div>

      <Form layout="vertical">
        <Form.Item label="报告标题" required>
          <Input
            placeholder="请输入"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            showCount
          />
        </Form.Item>
        <Form.Item label="作者">
          <Input
            placeholder="请输入"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={50}
          />
        </Form.Item>
        <Form.Item label="报告描述">
          <Input.TextArea
            placeholder="请输入"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autoSize={{ minRows: 4, maxRows: 6 }}
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>

      <div className="mt-2">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-semibold text-gray-800">
            添加图表
          </span>
          <Text type="secondary" className="text-xs">
            共 {charts.length} 个图表
          </Text>
        </div>

        {charts.length === 0 ? (
          <div className="h-16 text-center text-gray-500">
            <span className="text-sm">暂未添加图表</span>
          </div>
        ) : (
          <div className="space-y-3">
            {charts.map((chart, idx) => (
              <div
                key={`${chart.chartId}_${idx}`}
                className="flex items-center gap-3 rounded border border-blue-100 bg-blue-50/30 p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-blue-400 text-sm font-semibold text-blue-500">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">
                    {chart.chartName}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    {/* <span>{chart.chartType || '图表'}</span> */}
                    <span className="text-blue-500">{chart.chartId}</span>
                  </div>
                </div>
                <Space size="small">
                  <Button
                    size="small"
                    icon={<ArrowUpOutlined />}
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, -1)}
                  >
                    上移
                  </Button>
                  <Button
                    size="small"
                    icon={<ArrowDownOutlined />}
                    disabled={idx === charts.length - 1}
                    onClick={() => handleMove(idx, 1)}
                  >
                    下移
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(idx)}
                  >
                    删除
                  </Button>
                </Space>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 rounded border border-dashed border-gray-200 bg-gray-50/60 p-4">
        <Space.Compact className="w-full">
          <Select
            className="flex-1"
            showSearch={{
              filterOption: false,
              onSearch: (v) => setSearchKeyword(v),
            }}
            placeholder="输入图表名称或 ID 搜索"
            value={selectedChartId}
            onChange={(v) => setSelectedChartId(v)}
            loading={searchLoading}
            options={selectOptions}
            notFoundContent={
              searchLoading ? <Spin size="small" /> : '无匹配图表'
            }
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddChart}
          >
            添加图表
          </Button>
        </Space.Compact>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        {!inlinePreview && (
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => setPreviewOpen(true)}
          >
            预览效果
          </Button>
        )}
        <Button
          type="primary"
          icon={<GlobalOutlined />}
          loading={saving}
          onClick={handleOpenOfficial}
        >
          发布（仅自己可见）
        </Button>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={handleDownloadPdf}
        >
          下载PDF
        </Button>
        <Button onClick={() => navigate('/apps/storytelling')}>取消</Button>
      </div>
    </div>
  )
  const drawerContainer = useRef<HTMLDivElement>(null)

  return (
    <ContentWrapper
      title="研究报告"
      icon={<ReadOutlined />}
      permission={SUBSCRIPTION_PERMISSION_GROUPS.STANDARD}
      styles={{
        root: { minHeight: '100%' },
        content: { flex: 1, position: 'relative' },
      }}
    >
      <Skeleton active paragraph={{ rows: 6 }} loading={loading}>
        <div
          ref={containerRef}
          className="relative z-10 flex min-h-full items-start gap-4"
        >
          <div className="w-2/5 min-w-3xl shrink-0">
            <div className="mx-auto">{editorCard}</div>
          </div>
          <div
            className={
              inlinePreview
                ? 'sticky top-4 z-20 min-h-[calc(100vh-11rem)] w-2/5 min-w-3xl shrink-0'
                : 'hidden'
            }
            ref={drawerContainer}
          >
            <PreviewDrawer
              open={previewOpen || inlinePreview}
              closable={!inlinePreview}
              onClose={() => setPreviewOpen(false)}
              title={title}
              author={author}
              description={description}
              charts={charts}
              getContainer={
                inlinePreview
                  ? () => drawerContainer.current as HTMLElement
                  : undefined
              }
              onChangeDescription={handleChangeDescription}
            />
          </div>
        </div>
      </Skeleton>
    </ContentWrapper>
  )
}
