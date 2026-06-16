import { DataGrid, type Column } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Alert, Button, Skeleton } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import ReportHeader from '../components/ReportHeader'
import { useReport } from '@/hooks/useReport'
import { textSummaryReport } from './charts'
import type { TMLTaskResultResponse } from '@/apis/ml_task'
import type { TASK_TYPES } from '@/constants/ml_task'
import { downloadFile } from '@/utils/utils'
import ReportAlert from '../components/ReportAlert'

type TextSummaryResult = TMLTaskResultResponse<typeof TASK_TYPES.TEXT_SUMMARY>

interface ReportProps {
  result: TextSummaryResult
  onNewTask: () => void
}

interface TextSummaryRow {
  [key: string]: unknown
  id: string | number
  text: string
  summary: string
}

const gridColumns: Column<TextSummaryRow>[] = [
  {
    key: 'id',
    name: '序号',
    resizable: true,
    width: 80,
    renderCell: (props) => {
      return <div>{props.rowIdx + 1}</div>
    },
  },
  { key: 'text', name: '原始文本', resizable: true, width: '50%' },
  { key: 'label', name: '摘要结果', resizable: true, width: '40%' },
]

export default function Report({ result, onNewTask }: ReportProps) {
  const { tables, getOutputFile } = useReport(result, textSummaryReport)

  const tableState = tables.get('table')
  const tableData = (tableState?.data ?? []) as unknown as TextSummaryRow[]
  const tableLoading = tableState?.status === 'loading'

  const tableFile = getOutputFile('table')
  const allResultFile = getOutputFile('all_results')

  const handleDownloadData = (url?: string, fileSuffix?: string) => {
    if (!url) return
    downloadFile(
      `文本摘要_${result.taskId}${fileSuffix ? `_${fileSuffix}` : ''}.xlsx`,
      url,
    )
  }

  const summary = result.summary as
    | {
        startTime?: string | number
        endTime?: string | number
        elapsedSeconds?: number
      }
    | undefined

  return (
    <ReportHeader
      title="文本摘要任务报告"
      summary={summary}
      onNewTask={onNewTask}
    >
      {/* Summary result table */}
      <div className="rounded-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 p-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">结果概览</h3>
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
        <div className="h-[400px] w-full p-2">
          {tableLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} />
          ) : (
            <DataGrid
              columns={gridColumns}
              rows={tableData}
              className="rdg-light"
              style={{ height: '100%', width: '100%' }}
              rowHeight={60}
              headerRowHeight={28}
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
