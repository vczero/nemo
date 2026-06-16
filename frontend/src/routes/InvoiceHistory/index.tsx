import React, { useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  Button,
  Empty,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  Typography,
  Alert,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DownloadOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  PlusOutlined,
  SnippetsOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import ContentWrapper from '@/components/ContentWrapper'
import {
  GET_AVAILABLE_INVOICE_AMOUNT_ENDPOINT,
  GET_INVOICE_LIST_ENDPOINT,
  getAvailableInvoiceAmount,
  getInvoiceList,
} from '@/apis'
import type {
  TInvoiceAmountResponse,
  TInvoiceDTO,
  TInvoiceListRequest,
  TInvoiceListResponse,
} from '@/apis/types'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'

const formatCurrency = (value = 0) => {
  const safeValue = Number.isFinite(value) ? value : 0
  return `¥${safeValue.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const formatDateTime = (value?: number) => {
  if (!value) {
    return '-'
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm')
}

const getTypeText = (record: TInvoiceDTO) => {
  if (record.invoiceTypeDescription) {
    return record.invoiceTypeDescription
  }
  return record.invoiceType === 'ENTERPRISE' ? '企业' : '个人'
}

const getIssueTimeText = (record: TInvoiceDTO) => {
  if (record.issueTime) {
    return formatDateTime(record.issueTime)
  }

  if (record.status === 'PROCESSING') {
    return '正在开具中'
  }

  if (record.status === 'PENDING') {
    return '待处理'
  }

  return '-'
}

const InvoiceHistory: React.FC = () => {
  const navigate = useNavigate()
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const invoiceListSWRKey = [
    GET_INVOICE_LIST_ENDPOINT,
    { pageNum, pageSize },
  ] as const

  const {
    data: invoiceListData,
    error: invoiceListError,
    isLoading: isInvoiceListLoading,
  } = useSWR<TInvoiceListResponse>(
    invoiceListSWRKey,
    ([, params]: [string, TInvoiceListRequest]) => getInvoiceList(params),
    {
      keepPreviousData: true,
    }
  )

  const {
    data: invoiceAmountData,
    error: invoiceAmountError,
    isLoading: isInvoiceAmountLoading,
  } = useSWR<TInvoiceAmountResponse>(
    GET_AVAILABLE_INVOICE_AMOUNT_ENDPOINT,
    getAvailableInvoiceAmount
  )

  const columns: ColumnsType<TInvoiceDTO> = useMemo(
    () => [
      {
        title: '发票ID',
        key: 'invoiceIdentity',
        width: 200,
        render: (_, record) => {
          const value = record.invoiceNo || record.invoiceId || '-'
          return (
            <Tooltip title={value}>
              <Typography.Text className="text-sm" copyable={value !== '-'}>
                {value}
              </Typography.Text>
            </Tooltip>
          )
        },
      },
      {
        title: '纳税人识别号',
        dataIndex: 'creditCode',
        key: 'creditCode',
        width: 180,
        render: (value: string) => (
          <Typography.Text className="text-sm">{value || '-'}</Typography.Text>
        ),
      },
      {
        title: '抬头',
        dataIndex: 'title',
        key: 'title',
        width: 170,
        ellipsis: {
          showTitle: false,
        },
        render: (value: string) => (
          <Tooltip title={value || '-'}>
            <Typography.Text className="text-sm">
              {value || '-'}
            </Typography.Text>
          </Tooltip>
        ),
      },
      {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
        width: 140,
        render: (value: number) => (
          <Typography.Text strong className="text-sm text-slate-800">
            {formatCurrency(value)}
          </Typography.Text>
        ),
      },
      {
        title: '申请时间',
        dataIndex: 'applyTime',
        key: 'applyTime',
        width: 180,
        render: (value: number) => (
          <Typography.Text className="text-sm">
            {formatDateTime(value)}
          </Typography.Text>
        ),
      },
      {
        title: '开具时间',
        key: 'issueTime',
        width: 180,
        render: (_, record) => (
          <Typography.Text className="text-sm text-slate-700">
            {getIssueTimeText(record)}
          </Typography.Text>
        ),
      },
      {
        title: '类别',
        key: 'invoiceType',
        width: 120,
        render: (_, record) => (
          <Typography.Text className="text-sm">
            {getTypeText(record)}
          </Typography.Text>
        ),
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: TInvoiceDTO['status'], record) => {
          const statusColor =
            {
              ISSUED: 'success',
              PROCESSING: 'processing',
              PENDING: 'warning',
            }[status] || 'default'

          const statusText =
            record.statusDescription ||
            {
              ISSUED: '已开具',
              PROCESSING: '开具中',
              PENDING: '待处理',
            }[status] ||
            '-'

          return <Tag color={statusColor}>{statusText}</Tag>
        },
      },
      {
        title: '发票文件',
        key: 'invoiceFileUrl',
        width: 120,
        render: (_, record) =>
          record.invoiceFileUrl ? (
            <a
              href={record.invoiceFileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
            >
              <DownloadOutlined />
              查看
            </a>
          ) : (
            <Typography.Text type="secondary" className="text-sm">
              -
            </Typography.Text>
          ),
      },
    ],
    []
  )

  const amountCards = useMemo(
    () => [
      {
        icon: <WalletOutlined className="text-base" />,
        label: '可开票金额',
        value: formatCurrency(invoiceAmountData?.availableAmount),
      },
      {
        icon: <SnippetsOutlined className="text-base" />,
        label: '已开票金额',
        value: formatCurrency(invoiceAmountData?.totalInvoicedAmount ?? 0),
      },
      {
        icon: <FileTextOutlined className="text-base" />,
        label: '已支付订单金额',
        value: formatCurrency(invoiceAmountData?.totalPaidAmount ?? 0),
      },
    ],
    [
      invoiceAmountData?.totalInvoicedAmount,
      invoiceAmountData?.totalPaidAmount,
      invoiceAmountData?.availableAmount,
    ]
  )

  return (
    <ContentWrapper
      title="发票记录"
      icon={<FileSearchOutlined />}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/invoicing')}
        >
          去开票
        </Button>
      }
      withSpace={false}
      info={invoiceAmountError ? <Alert title="发票额度信息加载失败，请稍后重试。" type="error" /> : null}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {amountCards && amountCards.map((item) => (
          <div
            key={item.label}
            className="bg-white px-4 py-3 shadow-sm"
          >
            <div className="mb-2 flex items-center gap-2 text-slate-500">
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </div>
            <div className="text-xl font-semibold text-slate-900">
              {isInvoiceAmountLoading ? (
                <Skeleton.Input active size="small" />
              ) : (
                item.value
              )}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-4 bg-white p-2 shadow-sm sm:p-4">
        <h3 className="mb-4 text-lg font-bold">开票记录</h3>
        {isInvoiceListLoading && invoiceListData?.list === undefined ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : invoiceListError ? (
          <Empty description="开票记录加载失败，请稍后重试" />
        ) : (
          <Table
            rowKey="invoiceId"
            columns={columns}
            dataSource={invoiceListData?.list || []}
            loading={isInvoiceListLoading}
            scroll={{ x: 1300 }}
            pagination={{
              current: pageNum,
              pageSize,
              total: invoiceListData?.total || 0,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, size) => {
                setPageNum(page)
                setPageSize(size)
              },
            }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无开票记录"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </section>
    </ContentWrapper>
  )
}

export default InvoiceHistory
