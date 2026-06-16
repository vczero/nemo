import { useEffect, useState, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Layout, Skeleton, Drawer, Result, Button } from 'antd'
import { useSearchParams, useNavigate } from 'react-router'
import { ChartEditorProvider, useEditorStore, selectIsLoading } from '@/chart'

import { replaceChartDataFile } from '@/apis'
import SpreetSheetEditor from '@/components/SpreetSheetEditor/index'
import Header from '@/components/Header/index'

import ChartView from './components/ChartView'
import ConfigPanel from './components/ConfigPanel'
import DataPanel from './components/DataPanel'
import type { ChartData } from '@/chart/core/types'

const { Header: AntHeader, Sider, Content } = Layout

const PanelSkeleton = () => <Skeleton className="h-full w-full p-4" active />

export default function ChartEditorV2() {
  return (
    <ChartEditorProvider>
      <ChartEditorInner />
    </ChartEditorProvider>
  )
}

function ChartEditorInner() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const chartId = searchParams.get('id')

  const initialize = useEditorStore((s) => s.initialize)
  const reset = useEditorStore((s) => s.reset)
  const status = useEditorStore((s) => s.status)
  const error = useEditorStore((s) => s.error)
  const isLoading = useEditorStore(selectIsLoading)
  const chartFileId = useEditorStore((s) => s.chartFileId)
  const chartData = useEditorStore(useShallow((s) => s.chartData))
  const chartFileName = useEditorStore((s) => s.chartFileName)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 响应 store 中 chartId 变化 (demo → remote 切换时自动更新 URL)
  const replaceDataFile = useEditorStore((s) => s.replaceDataFile)

  const [isEditingData, setIsEditingData] = useState(false)

  // 仅在组件卸载时 reset（不在 chartId 变化时 reset，避免清空 createNewChart 写入的数据）
  useEffect(() => {
    return () => { reset() }
  }, [])

  // chartId 变化时初始化（initialize 内部已处理重复 chartId 的跳过逻辑）
  useEffect(() => {
    if (!chartId || !containerRef.current) return
    initialize(chartId, containerRef.current)
  }, [chartId])

  // Editing data sheet callback
  // SpreetSheetEditor returns (data, xlsxFile) — we only need data, store handles xlsx conversion
  const handleSaveEditingData = async (data: ChartData, xlsxFile: File) => {
    if (!chartFileId) return
    const response = await replaceChartDataFile({
      file: xlsxFile,
      fileId: chartFileId,
    })

    const uploadFile = {
      response: response,
      fileContent: data,
      originFileObj: xlsxFile,
    }

    await replaceDataFile(uploadFile)
    setIsEditingData(false)
  }

  return (
    <Layout className="h-screen w-screen min-w-270 bg-gray-50">
      <AntHeader className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <Header />
      </AntHeader>
      {!chartId ? (
        <Result
          status="404"
          title="缺少图表 ID"
          subTitle="请检查 URL 是否正确"
          className="bg-gray-50"
          extra={
            <Button
              type="primary"
              onClick={() => navigate('/apps/charts', { replace: true })}
            >
              返回列表
            </Button>
          }
        />
      ) : status === 'error' ? (
        <Result
          status="error"
          title="加载失败"
          subTitle={error || '请稍后重试'}
          className="bg-gray-50"
          extra={
            <Button type="primary" onClick={() => location.reload()}>
              重试
            </Button>
          }
        />
      ) : (
        <Layout>
          <Sider
            width="280px"
            className="min-w-72 border-r border-gray-200 bg-white"
          >
            {isLoading ? (
              <PanelSkeleton />
            ) : (
              <DataPanel onEditData={() => setIsEditingData(true)} />
            )}
          </Sider>

          <Content className="overflow-y-auto bg-gray-50 p-0">
            <ChartView  containerRef={containerRef} />
          </Content>

          <Sider
            width="320px"
            className="min-w-80 border-l border-gray-200 bg-white"
          >
            {/* 这里简单处理，如果 chartId 变化，则重新渲染 ConfigPanel，因为如果手动重置 form initialValue 可能会有意料之外的 bug */}
            {isLoading ? <PanelSkeleton /> : <ConfigPanel key={chartId} />}
          </Sider>
        </Layout>
      )}

      {/* 数据编辑 Drawer */}
      <Drawer
        placement="bottom"
        closable={false}
        maskClosable={false}
        open={isEditingData}
        size={window.innerHeight}
      >
        {isEditingData && chartData && (
          <SpreetSheetEditor
            editable
            fileName={chartFileName ?? undefined}
            initialDataSource={chartData as any[][]}
            onSave={handleSaveEditingData}
            onCancel={() => setIsEditingData(false)}
          />
        )}
      </Drawer>
    </Layout>
  )
}
