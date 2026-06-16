import { DataGrid, type Column } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Button, Skeleton, Statistic } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import ReportHeader from '../components/ReportHeader'
import ReportChartCard from '../components/ReportChartCard'
import { useReport } from '@/hooks/useReport'
import { docSimilarityReport } from './charts'
import type { TMLTaskResultResponse } from '@/apis/ml_task'
import type { TASK_TYPES } from '@/constants/ml_task'
import { downloadFile } from '@/utils/utils'
import ReportAlert from '../components/ReportAlert'

type DocSimResult = TMLTaskResultResponse<typeof TASK_TYPES.DOC_SIM>

interface ReportProps {
  result: DocSimResult
  onNewTask: () => void
}

type Row = Record<string, unknown>

const formatScore = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : '-'
}

const gridColumns: Column<Row>[] = [
  { key: 'doc_id_1', name: '文档 ID 1', resizable: true, width: '33%' },
  { key: 'doc_id_2', name: '文档 ID 2', resizable: true, width: '33%' },
  { key: 'similarity_score', name: '相似度', resizable: true, width: '34%', renderCell: (props) => {
    return <div>{formatScore(props.row.similarity_score)}</div>
  } },
]

export default function Report({ result, onNewTask }: ReportProps) {
  const { charts, bindRef, tables, getOutputFile } = useReport(
    result,
    docSimilarityReport
  )

  const tableState = tables.get('table')
  const tableData = (tableState?.data ?? []) as Row[]
  const tableLoading = tableState?.status === 'loading'

  const tableFile = getOutputFile('table')
  const allResultFile = getOutputFile('all_results')

  const handleDownloadData = (url?: string, file_suffix?: string) => {
    if (!url) return
    downloadFile(
      `文本相似度_${result.taskId}${file_suffix ? `_${file_suffix}` : ''}.xlsx`,
      url
    )
  }

  const heatmapState = charts.get('matrix_heatmap')

  const summary = result.summary as
    | {
        total_documents?: number
        total_pairs?: number
        elapsedSeconds?: number
        max_similarity?: number
        min_similarity?: number
        avg_similarity?: number
      }
    | undefined

  return (
    <ReportHeader
      title="文本相似度报告"
      summary={summary}
      onNewTask={onNewTask}
    >
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-sm border border-gray-200 bg-white p-4">
          <Statistic
            title="最大相似度"
            value={formatScore(summary?.max_similarity)}
          />
        </div>
        <div className="rounded-sm border border-gray-200 bg-white p-4">
          <Statistic
            title="最小相似度"
            value={formatScore(summary?.min_similarity)}
          />
        </div>
        <div className="rounded-sm border border-gray-200 bg-white p-4">
          <Statistic
            title="平均相似度"
            value={formatScore(summary?.avg_similarity)}
          />
        </div>
      </div>

      <div className="mb-6">
        <ReportChartCard
          title="相似度矩阵热力图"
          chartId={heatmapState?.chartId}
          containerRef={bindRef('matrix_heatmap')}
          height="480px"
          loading={
            heatmapState?.status === 'pending' ||
            heatmapState?.status === 'creating'
          }
          error={heatmapState?.error}
        />
      </div>

      <div className="rounded-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 p-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">相似度明细表</h3>
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
