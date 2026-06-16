import { DataGrid, type Column } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Alert, Button, Skeleton } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import ReportHeader from '../components/ReportHeader'
import ReportChartCard from '../components/ReportChartCard'
import { useReport } from '@/hooks/useReport'
import { sentimentReport } from './charts'
import type { TMLTaskResultResponse } from '@/apis/ml_task'
import type { TASK_TYPES } from '@/constants/ml_task'
import { downloadFile } from '@/utils/utils'
import ReportAlert from '../components/ReportAlert'

type SentimentResult = TMLTaskResultResponse<typeof TASK_TYPES.SENTIMENT>

interface ReportProps {
  result: SentimentResult
  onNewTask: () => void
}

interface SentimentRow {
  [key: string]: unknown
  text: string
  sentiment_score: number
  sentiment_label: string
}

const gridColumns: Column<SentimentRow>[] = [
  { key: 'text', name: '文本', resizable: true, width: '70%' },
  {
    key: 'score',
    name: '情感得分',
    width: '20%',
    resizable: true,
  },
  {
    key: 'label',
    name: '情感分类',
    width: '10%',
    resizable: true,
  },
]

export default function Report({ result, onNewTask }: ReportProps) {
  const { charts, bindRef, tables, getOutputFile } = useReport(
    result,
    sentimentReport,
  )

  const tableState = tables.get('table')
  const tableData = (tableState?.data ?? []) as unknown as SentimentRow[]
  const tableLoading = tableState?.status === 'loading'

  const tableFile = getOutputFile('table')
  const allResultFile = getOutputFile('all_results')

  const handleDownloadData = (url?: string, fileSuffix?: string) => {
    if (!url) return
    downloadFile(
      `情感计算_${result.taskId}${fileSuffix ? `_${fileSuffix}` : ''}.xlsx`,
      url,
    )
  }

  const pieState = charts.get('donut_chart')

  const summary = result.summary as
    | {
        startTime?: string | number
        endTime?: string | number
        elapsedSeconds?: number
      }
    | undefined

  return (
    <ReportHeader
      title="情感分析与计算报告"
      summary={summary}
      onNewTask={onNewTask}
    >
      {/* Chart */}
      <div className="mb-6">
        <ReportChartCard
          title="情感占比"
          chartId={pieState?.chartId}
          containerRef={bindRef('donut_chart')}
          maxWidth="480px"
          loading={
            pieState?.status === 'pending' || pieState?.status === 'creating'
          }
          error={pieState?.error}
        />
      </div>

      {/* Sentiment data table */}
      <div className="rounded-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 p-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">情感计算数据</h3>
            <p className="text-xs text-gray-500 max-md:hidden">
              当前提供 {tableData.length} 条数据供预览
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              type="default"
              className="max-sm:hidden"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleDownloadData(tableFile?.fileUrl, 'slice_data')
              }
              disabled={!tableFile?.fileUrl}
            >
              下载当前表格预览数据
            </Button>
            <Button
              size="small"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadData(allResultFile?.fileUrl, 'all_data')}
              disabled={!allResultFile?.fileUrl}
            >
              下载完整数据
            </Button>
          </div>
        </div>
        <div className="h-[350px] w-full p-2">
          {tableLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : (
            <DataGrid
              columns={gridColumns}
              rows={tableData}
              className="rdg-light"
              style={{ height: '100%', width: '100%' }}
              rowHeight={25}
              headerRowHeight={25}
              defaultColumnOptions={{
                resizable: true,
                sortable: false,
                draggable: false,
              }}
            />
          )}
        </div>
      </div>
      <div className="mt-4">
        <ReportAlert />
      </div>
    </ReportHeader>
  )
}
