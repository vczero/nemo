import { DataGrid, type Column } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Alert, Button, Skeleton } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import ReportHeader from '../components/ReportHeader'
import ReportChartCard from '../components/ReportChartCard'
import { useReport } from '@/hooks/useReport'
import { coOccurrenceReport } from './charts'
import { downloadFile } from '@/utils/utils'
import type { TMLTaskResultResponse } from '@/apis/ml_task'
import type { TASK_TYPES } from '@/constants/ml_task'
import ReportAlert from '../components/ReportAlert'

type CoOccurrenceResult = TMLTaskResultResponse<typeof TASK_TYPES.CO_OCCURRENCE>

interface ReportProps {
  result: CoOccurrenceResult
  onNewTask: () => void
}

interface CoOccurrenceRow {
  [key: string]: unknown
  word1: string
  word2: string
  frequency: number
}

const gridColumns: Column<CoOccurrenceRow>[] = [
  { key: 'word1', name: '词语', resizable: true },
  { key: 'word2', name: '词语', resizable: true },
  { key: 'count', name: '频次', resizable: true, width: 120 },
]

export default function Report({ result, onNewTask }: ReportProps) {
  const { charts, bindRef, tables, getOutputFile } = useReport(
    result,
    coOccurrenceReport
  )

  const graphState = charts.get('force_directed_graph')

  const tableState = tables.get('table')
  const tableData = (tableState?.data ?? []) as unknown as CoOccurrenceRow[]
  const tableLoading = tableState?.status === 'loading'

  const tableFile = getOutputFile('table')
  const allResultFile = getOutputFile('all_results')

  const handleDownloadData = (url?: string, file_suffix?: string) => {
    if (!url) return
    downloadFile(
      `语义共现网络_${result.taskId}${file_suffix ? `_${file_suffix}` : ''}.xlsx`,
      url
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
      title="语义共现网络报告"
      summary={summary}
      onNewTask={onNewTask}
    >
      {/* Graph chart */}
      <div className="mb-6">
        <ReportChartCard
          title="词共现网络"
          chartId={graphState?.chartId}
          containerRef={bindRef('force_directed_graph')}
          height="420px"
          // maxWidth="550px"
          loading={
            graphState?.status === 'pending' ||
            graphState?.status === 'creating'
          }
          error={graphState?.error}
        />
      </div>

      {/* Co-occurrence table */}
      <div className="rounded-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 p-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">词共现表格</h3>
            <p className="text-xs text-gray-500 max-md:hidden">
              默认展示前 {tableData.length} 个词汇对
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
