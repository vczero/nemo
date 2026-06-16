import React, { useState } from 'react'
import useSWR from 'swr'
import {
  Table,
  Space,
  Typography,
  Skeleton,
  Empty,
  Tooltip,
  Button,
} from 'antd'
import {
  ShoppingOutlined,
  AlipayCircleOutlined,
  WechatOutlined,
  PlusOutlined,
  DashboardFilled,
  CreditCardOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import ContentWrapper from '@/components/ContentWrapper'
import {
  GET_ORDERS_ENDPOINT,
  getOrders,
  GET_TOKEN_PACK_ORDERS_ENDPOINT,
  getTokenPackOrders,
} from '@/apis'
import type {
  TOrderDTO,
  TOrderListRequest,
  TOrderListResponse,
  TTokenPackOrderDTO,
  TTokenPackOrderListRequest,
  TTokenPackOrderListResponse,
} from '@/apis/types'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'
import { PAYMENT_METHOD, type TPaymentMethod } from '@/constants/common'

const { Text } = Typography

const formatTokenAmount = (amount: number) => {
  return amount.toLocaleString()
}

const getPayMethodIcon = (method: TPaymentMethod) => {
  if (method === PAYMENT_METHOD.ALIPAY) {
    return <AlipayCircleOutlined className="text-blue-500" />
  }
  if (method === PAYMENT_METHOD.WECHAT) {
    return <WechatOutlined className="text-green-500" />
  }

  if (method === PAYMENT_METHOD.INTERNAL_POINT) {
    return <CreditCardOutlined className="text-purple-500" />
  }

  if (method === PAYMENT_METHOD.EXTERNAL) {
    return (
      <>
        <DashboardFilled className="text-gray-500" /> 第三方渠道
      </>
    )
  }
  return null
}

const columns: ColumnsType<TOrderDTO> = [
  {
    title: '订单编号',
    dataIndex: 'orderNo',
    key: 'orderNo',
    width: 180,
    render: (text) => (
      <Tooltip title={text}>
        <Text copyable className="text-xs">
          {text}
        </Text>
      </Tooltip>
    ),
  },
  {
    title: '金额',
    key: 'amount',
    width: 80,
    render: (_, record) => {
      if (record.payMethod !== PAYMENT_METHOD.EXTERNAL && record.payAmount >= 0) {
        return (
          <div className="flex flex-col gap-1">
            <Text strong className="text-sm">
              ¥{record.payAmount.toFixed(2)}
            </Text>
          </div>
        )
      } else {
        return (
          <Text type="secondary" className="text-xs">
            请到对应下单平台查看
          </Text>
        )
      }
    },
  },
  {
    title: '支付方式',
    dataIndex: 'payMethod',
    key: 'payMethod',
    width: 120,
    align: 'center',
    render: (method) =>
      method ? (
        <Space>{getPayMethodIcon(method)}</Space>
      ) : (
        <Text type="secondary" className="text-xs">
          -
        </Text>
      ),
  },
  {
    title: '付款时间',
    dataIndex: 'paidTime',
    key: 'paidTime',
    width: 140,
    render: (time, record) => {
      if (record.payMethod !== 'EXTERNAL' && time >= 0) {
        return (
          <Text className="text-xs">
            {dayjs(time).format('YYYY-MM-DD HH:mm')}
          </Text>
        )
      } else {
        return (
          <Text className="text-xs">
            请到对应下单平台查看
          </Text>
        )
      }
    },
  },
  {
    title: '购买时长',
    dataIndex: 'subscriptionMonths',
    key: 'subscriptionMonths',
    width: 180,
    render: (data: number) => (
      <Text className="text-xs">
        {data}
      </Text>
    ),
  },
]

const tpColumns: ColumnsType<TTokenPackOrderDTO> = [
  {
    title: '订单编号',
    dataIndex: 'orderNo',
    key: 'orderNo',
    width: 180,
    render: (text) => (
      <Tooltip title={text}>
        <Text copyable className="text-xs">
          {text}
        </Text>
      </Tooltip>
    ),
  },
  {
    title: '金额',
    dataIndex: 'payAmount',
    key: 'payAmount',
    width: 80,
    render: (amount) => <Text className="text-sm">{amount.toFixed(2)}</Text>,
  },
  {
    title: '支付方式',
    key: 'payMethod',
    width: 120,
    align: 'center',
    render: () => <AlipayCircleOutlined className="text-lg text-blue-500" />,
  },
  {
    title: '付款时间',
    dataIndex: 'paidTime',
    key: 'paidTime',
    width: 140,
    render: (time) =>
      time ? (
        <Text className="text-xs">
          {dayjs(time).format('YYYY.MM.DD HH:mm')}
        </Text>
      ) : (
        <Text type="secondary" className="text-xs">
          -
        </Text>
      ),
  },
  {
    title: '初始容量',
    dataIndex: 'tokenInitialAmount',
    key: 'tokenInitialAmount',
    width: 90,
    render: (amount) => (
      <Text className="text-sm">{formatTokenAmount(amount)}</Text>
    ),
  },
  {
    title: '已使用',
    key: 'usage',
    width: 100,
    render: (_, record) => {
      const percent =
        record.tokenInitialAmount > 0
          ? Math.round(
              (record.tokenUsedAmount / record.tokenInitialAmount) * 100
            )
          : 0
      return <Text className="text-sm">{percent}%</Text>
    },
  },
  {
    title: '产品使用周期',
    key: 'period',
    width: 180,
    render: (_, record) =>
      record.paidTime && record.expireTime ? (
        <Text className="text-xs">
          {dayjs(record.paidTime).format('YYYY.MM.DD')}{' '}-{' '}
          {dayjs(record.expireTime).format('YYYY.MM.DD')}
        </Text>
      ) : (
        <Text type="secondary" className="text-xs">
          -
        </Text>
      ),
  },
]
const Orders: React.FC = () => {
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [tpPageNum, setTpPageNum] = useState(1)
  const [tpPageSize, setTpPageSize] = useState(10)
  const navigate = useNavigate()

  // 产品订阅订单
  const swrKey = [GET_ORDERS_ENDPOINT, { pageNum, pageSize }] as const
  const { data, error, isLoading } = useSWR<TOrderListResponse>(
    swrKey,
    ([, params]: [string, TOrderListRequest]) => getOrders(params),
    { keepPreviousData: true }
  )

  // 流量包订单
  const tpSwrKey = [
    GET_TOKEN_PACK_ORDERS_ENDPOINT,
    { pageNum: tpPageNum, pageSize: tpPageSize },
  ] as const
  const {
    data: tpData,
    error: tpError,
    isLoading: tpIsLoading,
  } = useSWR<TTokenPackOrderListResponse>(
    tpSwrKey,
    ([, params]: [string, TTokenPackOrderListRequest]) =>
      getTokenPackOrders(params),
    { keepPreviousData: true }
  )


  return (
    <ContentWrapper
      title="我的订单"
      icon={<ShoppingOutlined />}
      withSpace={false}
    >
      <div className="bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="mb-4 text-lg font-bold">产品订阅订单</h3>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/subscription')}
          >
            订阅新产品
          </Button>
        </div>
        {isLoading && !data?.list?.length ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : error ? (
          <Empty description="加载失败，请稍后重试" />
        ) : (
          <Table
            columns={columns}
            dataSource={data?.list || []}
            rowKey="orderId"
            pagination={{
              current: pageNum,
              pageSize: pageSize,
              total: data?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条订单`,
              onChange: (page, size) => {
                setPageNum(page)
                setPageSize(size)
              },
            }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无订单"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </div>

      <div className="mt-6 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="mb-4 text-lg font-bold">大模型推理流量包</h3>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/topup')}
          >
            去加购流量包
          </Button>
        </div>
        {tpIsLoading && !tpData?.list?.length ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : tpError ? (
          <Empty description="加载失败，请稍后重试" />
        ) : (
          <Table
            columns={tpColumns}
            dataSource={tpData?.list || []}
            rowKey="orderId"
            pagination={{
              current: tpPageNum,
              pageSize: tpPageSize,
              total: tpData?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, size) => {
                setTpPageNum(page)
                setTpPageSize(size)
              },
            }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无流量包订单"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </div>
    </ContentWrapper>
  )
}

export default Orders
