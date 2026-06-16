import React, { useState } from 'react'
import useSWR from 'swr'
import { Button, Pagination, Empty, Popconfirm, App, Alert } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  FundProjectionScreenOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import { TASK_METADATA_MAP } from '@/constants/ml_task'
import { GET_ALL_MY_CHARTS_ENDPOINT, deleteChart, getMyCharts } from '@/apis'
import type { TGetAllMyChartsResponse } from '@/apis/types'
import ContentWrapper from '@/components/ContentWrapper'
import { ChartCard } from '@/components/ChartCard'

const ChartList: React.FC = () => {
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  const { message } = App.useApp()
  const swrKey = [GET_ALL_MY_CHARTS_ENDPOINT, { pageNum, pageSize }] as const
  const {
    data,
    error: error,
    isLoading,
    mutate: mutateCurrent,
  } = useSWR(swrKey, ([, params]) => getMyCharts(params), {
    keepPreviousData: true,
  })
  const navigate = useNavigate()

  const handleDelete = async (id: string) => {
    try {
      await deleteChart(id)
      message.success('删除成功')
      mutateCurrent()
    } catch {
      // do nothing
    }
  }

  const handleCreate = () => {
    navigate('/apps/charts')
  }

  const defaultList = new Array(15).fill({})
  const list: TGetAllMyChartsResponse['list'] = isLoading ? defaultList : data?.list || []

  return (
    <ContentWrapper
      title="我的图表"
      icon={<FundProjectionScreenOutlined />}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          创建新图表
        </Button>
      }
      withSpace={false}
      info={
        error ? (
          <Alert title="图表列表加载失败，请稍后重试。" type="error" />
        ) : null
      }
    >
      {list && list.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
          {list.map((item, idx) => (
            <ChartCard
              key={item.chartId || idx}
              link={`/my-charts/edit?id=${item.chartId}`}
              title={item.chartName}
              loading={isLoading}
              subtitle={
                item.task?.taskId
                  ? `计算任务: [${TASK_METADATA_MAP[item.task?.taskType]?.title}-${item.task?.taskId}]`
                  : dayjs(item.updateTime).format('YYYY-MM-DD HH:mm:ss')
              }
              image={item.thumbnailUrl}
              extra={
                <Popconfirm
                  classNames={{ root: 'max-w-[400px]' }}
                  title="删除图表"
                  description={
                    item.task?.taskId
                      ? `当前删除的是计算任务:[${TASK_METADATA_MAP[item.task?.taskType]?.title}-${item.task?.taskId}]中的结果可视化图，删除后，报告中的对应图片也会同步删除。`
                      : '确定要删除这个图表吗？此操作无法恢复。'
                  }
                  onConfirm={(e) => {
                    e?.stopPropagation()
                    handleDelete(item.chartId)
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                  okText="删除"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    shape="circle"
                    icon={<DeleteOutlined />}
                    className="bg-white/90 shadow-sm hover:bg-red-50"
                    onClick={(e) => e?.stopPropagation()}
                  />
                </Popconfirm>
              }
            />
          ))}
        </div>
      ) : (
        !isLoading && (
          <div className="bg-white py-20 shadow-sm">
            <Empty description="暂无图表，快去创建一个吧！" />
          </div>
        )
      )}
      {data && data.total > 0 && (
        <div className="mt-8 flex justify-end">
          <Pagination
            current={pageNum}
            pageSize={pageSize}
            total={data.total}
            showTotal={(total) => `共 ${total} 条`}
            onChange={(page, size) => {
              setPageNum(page)
              setPageSize(size)
            }}
          />
        </div>
      )}
    </ContentWrapper>
  )
}

export default ChartList
