import { useMemo } from 'react'
import { DataGrid, type Column } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Button, Skeleton } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import ReportHeader from '../components/ReportHeader'
import ReportChartCard from '../components/ReportChartCard'
import { useReport } from '@/hooks/useReport'
import { tfIdfReport } from './charts'
import type { TMLTaskResultResponse } from '@/apis/ml_task'
import type { TASK_TYPES } from '@/constants/ml_task'
import { downloadFile } from '@/utils/utils'
import ReportAlert from '../components/ReportAlert'

type TfIdfResult = TMLTaskResultResponse<typeof TASK_TYPES.TF_IDF>

interface ReportProps {
  result: TfIdfResult
  onNewTask: () => void
}

type Row = Record<string, unknown>

const gridColumns: Column<Row>[] = [
  // {
  //   key: 'id',
  //   name: '序号',
  //   resizable: true,
  //   width: 80,
  //   renderCell: (props) => {
  //     return <div>{props.rowIdx + 1}</div>
  //   },
  // },
  { key: 'document_index', name: '文档 ID', resizable: true, width: '20%' },
  { key: 'word', name: '词语', resizable: true, width: '30%' },
  { key: 'tfidf_score', name: 'TF-IDF Score', resizable: true, width: '40%' },
]

export default function Report({ result, onNewTask }: ReportProps) {
  const { charts, bindRef, tables, getOutputFile } = useReport(
    result,
    tfIdfReport
  )

  const tableState = tables.get('table')
  const tableData = (tableState?.data ?? []) as Row[]
  const tableLoading = tableState?.status === 'loading'

  const tableFile = getOutputFile('table')
  const docTopKeywordsFile = getOutputFile('doc_top_keywords')
  const allResultFile = getOutputFile('all_results')

  const handleDownloadData = (url?: string, file_suffix?: string) => {
    if (!url) return
    downloadFile(
      `TF-IDF_${result.taskId}${file_suffix ? `_${file_suffix}` : ''}.xlsx`,
      url
    )
  }

  const wordcloudState = charts.get('wordcloud')
  const topWordsState = charts.get('horizontal_bar')

  const summary = result.summary as
    | {
        startTime?: string | number
        endTime?: string | number
        elapsedSeconds?: number
      }
    | undefined

  return (
    <ReportHeader title="TF-IDF 报告" summary={summary} onNewTask={onNewTask}>
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReportChartCard
          title="词云分布图"
          chartId={wordcloudState?.chartId}
          containerRef={bindRef('wordcloud')}
          loading={
            wordcloudState?.status === 'pending' ||
            wordcloudState?.status === 'creating'
          }
          error={wordcloudState?.error}
        />
        <ReportChartCard
          title="高频关键词 TOP 10"
          chartId={topWordsState?.chartId}
          containerRef={bindRef('horizontal_bar')}
          loading={
            topWordsState?.status === 'pending' ||
            topWordsState?.status === 'creating'
          }
          error={topWordsState?.error}
        />
      </div>

      <div className="rounded-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 p-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">关键词明细表</h3>
            <p className="text-xs text-gray-500 max-md:hidden">
              当前仅展示前 {tableData.length} 条数据
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
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
              type="default"
              icon={<DownloadOutlined />}
              onClick={() =>
                handleDownloadData(docTopKeywordsFile?.fileUrl, 'top_n')
              }
              disabled={!docTopKeywordsFile?.fileUrl}
            >
              下载 Top N 数据
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
