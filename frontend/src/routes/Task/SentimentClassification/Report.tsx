import { DataGrid, type Column } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Alert, Button, Skeleton } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import ReportHeader from '../components/ReportHeader'
import ReportChartCard from '../components/ReportChartCard'
import { useReport } from '@/hooks/useReport'
import { sentimentClassificationReport } from './charts'
import type { TMLTaskResultResponse } from '@/apis/ml_task'
import type { TASK_TYPES } from '@/constants/ml_task'
import { downloadFile } from '@/utils/utils'
import ReportAlert from '../components/ReportAlert'

type SentimentClassificationResult = TMLTaskResultResponse<
  typeof TASK_TYPES.SENTIMENT_CLASSIFICATION
>

interface ReportProps {
  result: SentimentClassificationResult
  onNewTask: () => void
}

interface SentimentClassificationRow {
  [key: string]: unknown
  id: string | number
  text: string
  category: string
}

const gridColumns: Column<SentimentClassificationRow>[] = [
  {
    key: 'id',
    name: '序号',
    resizable: true,
    width: 80,
    renderCell: (props) => {
      return <div>{props.rowIdx + 1}</div>
    },
  },
  { key: 'text', name: '文本', resizable: true, width: '70%' },
  { key: 'label', name: '分类结果', resizable: true, width: '20%' },
]

export default function Report({ result, onNewTask }: ReportProps) {
  const { charts, bindRef, tables, getOutputFile } = useReport(
    result,
    sentimentClassificationReport,
  )

  const tableState = tables.get('table')
  const tableData = (tableState?.data ?? []) as unknown as SentimentClassificationRow[]
  const tableLoading = tableState?.status === 'loading'

  const tableFile = getOutputFile('table')
  const allResultFile = getOutputFile('all_results')

  const handleDownloadData = (url?: string, fileSuffix?: string) => {
    if (!url) return
    downloadFile(
      `情感分类_${result.taskId}${fileSuffix ? `_${fileSuffix}` : ''}.xlsx`,
      url,
    )
  }

  const pieState = charts.get(sentimentClassificationReport.charts[0].key)

  const summary = result.summary as
    | {
        startTime?: string | number
        endTime?: string | number
        elapsedSeconds?: number
      }
    | undefined

  return (
    <ReportHeader
      title="情感分类任务报告"
      summary={summary}
      onNewTask={onNewTask}
    >
      <div className="mb-6">
        <ReportChartCard
          title="分类结果概览"
          chartId={pieState?.chartId}
          containerRef={bindRef(sentimentClassificationReport.charts[0].key)}
          maxWidth="480px"
          loading={
            pieState?.status === 'pending' || pieState?.status === 'creating'
          }
          error={pieState?.error}
        />
      </div>

      {/* Classification result table */}
      <div className="rounded-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 p-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">分类结果概览</h3>
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
              onClick={() =>
                handleDownloadData(allResultFile?.fileUrl, 'all_data')
              }
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
