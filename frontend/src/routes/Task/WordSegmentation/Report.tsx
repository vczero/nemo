import { DataGrid, type Column } from 'react-data-grid'
import 'react-data-grid/lib/styles.css'
import { Button, Alert, Skeleton } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import ReportHeader from '../components/ReportHeader'
import ReportChartCard from '../components/ReportChartCard'
import { useReport } from '@/hooks/useReport'
import { wordSegmentationReport } from './charts'
import type { TMLTaskResultResponse } from '@/apis/ml_task'
import type { TASK_TYPES } from '@/constants/ml_task'
import { downloadFile } from '@/utils/utils'
import ReportAlert from '../components/ReportAlert'

type WordSegmentationResult = TMLTaskResultResponse<
  typeof TASK_TYPES.WORD_SEGMENTATION
>

interface ReportProps {
  result: WordSegmentationResult
  onNewTask: () => void
}

interface WordRow {
  [key: string]: unknown
  rank: number
  word: string
  POS: string
  frequency: number
  rate: number
}

const posMap = {
  n: '普通名词',
  f: '方位名词',
  s: '处所名词',
  t: '时间',
  nr: '人名',
  ns: '地名',
  nt: '机构名',
  nw: '作品名',
  nz: '其他专名',
  v: '普通动词',
  vd: '动副词',
  vn: '名动词',
  a: '形容词',
  ad: '副形词',
  an: '名形词',
  d: '副词',
  m: '数量词',
  q: '量词',
  r: '代词',
  p: '介词',
  c: '连词',
  u: '助词',
  xc: '其他虚词',
  w: '标点符号',
  PER: '人名',
  LOC: '地名',
  ORG: '机构名',
  TIME: '时间',
}

const gridColumns: Column<WordRow>[] = [
  {
    key: 'rank',
    name: '排名',
    resizable: true,
    width: 80,
    renderCell: (props) => {
      return <div>{props.rowIdx + 1}</div>
    },
  },
  { key: 'word', name: '词语', resizable: true },
  {
    key: 'POS',
    name: '词性',
    width: 100,
    resizable: true,
    renderCell: ({ row }) => (
      <>{posMap[row.POS as keyof typeof posMap] || '其他'}</>
    ),
  },
  { key: 'frequency', name: '出现次数', resizable: true, width: 120 },
  {
    key: 'rate',
    name: '频率占比',
    // width: 120,
    resizable: true,
    renderCell: ({ row }) => <>{`${(Number(row.rate) * 100).toFixed(2)}%`}</>,
  },
]

export default function Report({ result, onNewTask }: ReportProps) {
  const { charts, bindRef, tables, getOutputFile } = useReport(
    result,
    wordSegmentationReport
  )

  const tableState = tables.get('table')
  const tableData = (tableState?.data ?? []) as unknown as WordRow[]
  const tableLoading = tableState?.status === 'loading'

  const allResultFile = getOutputFile('all_results')
  const tableFile = getOutputFile('table')

  const handleDownloadData = (url?: string, file_suffix?: string) => {
    if (!url) return
    downloadFile(
      `分词与统计_${result.taskId}${file_suffix ? `_${file_suffix}` : ''}.xlsx`,
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
    <ReportHeader
      title="分词与统计报告"
      summary={summary}
      onNewTask={onNewTask}
    >
      {/* Charts row */}
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
          title="高频词统计 TOP 10"
          chartId={topWordsState?.chartId}
          containerRef={bindRef('horizontal_bar')}
          loading={
            topWordsState?.status === 'pending' ||
            topWordsState?.status === 'creating'
          }
          error={topWordsState?.error}
        />
      </div>

      {/* Word frequency table */}
      <div className="rounded-sm border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 p-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">词频明细表</h3>
            <p className="text-xs text-gray-500 max-md:hidden">
              当前仅展示前 {tableData.length} 条数据
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
              // rowKeyGetter={(row) => row.rank}
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
