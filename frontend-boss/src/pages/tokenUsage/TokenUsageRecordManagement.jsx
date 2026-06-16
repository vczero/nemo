import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Table,
  Button,
  Select,
  Space,
  Drawer,
  Descriptions,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { getTokenUsageRecordPage, getTokenUsageRecordDetail } from '../../services/tokenUsageRecord'
import { COMPUTE_TYPE_CONFIG, LLM_COMPUTE_TYPES, COMPUTE_TYPE_OPTIONS } from '../../constants/computeType'
import UserSelect from '../../components/UserSelect'
import dayjs from 'dayjs'

const { Option } = Select

const TokenUsageRecordManagement = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [searchParams, setSearchParams] = useState({
    accountId: '',
    bizType: undefined,
    startDate: null,
    endDate: null,
  })
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [recordDetail, setRecordDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // 处理用户选择变化
  const handleUserSelectChange = user => {
    setSelectedUser(user)
    setSearchParams({ ...searchParams, accountId: user?.userId || null, bizType: undefined })
  }

  // 获取记录列表
  const fetchRecords = async (params = {}) => {
    setLoading(true)
    try {
      const { pageNum = 1, pageSize = 20, ...rest } = params
      const response = await getTokenUsageRecordPage({
        pageNum,
        pageSize,
        ...searchParams,
        ...rest,
      })

      if (response.data) {
        setRecords(response.data || [])
        setPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total,
        })
      }
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取记录详情
  const fetchRecordDetail = async recordId => {
    setDetailLoading(true)
    try {
      const response = await getTokenUsageRecordDetail(recordId)
      if (response.data) {
        setRecordDetail(response.data)
      }
    } catch (error) {
      console.error('Error fetching record detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  // 处理表格变化
  const handleTableChange = pagination => {
    fetchRecords({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    })
  }

  // 处理搜索
  const handleSearch = () => {
    fetchRecords({
      pageNum: 1,
      pageSize: pagination.pageSize,
    })
  }

  // 重置搜索（只重置业务类型，不清除用户）
  const handleReset = () => {
    setSearchParams({
      ...searchParams,
      bizType: undefined,
      startDate: null,
      endDate: null,
    })
  }

  // 查看详情
  const handleViewDetail = record => {
    setSelectedRecord(record)
    setDetailVisible(true)
    fetchRecordDetail(record.recordId)
  }

  // 关闭详情抽屉
  const handleCloseDetail = () => {
    setDetailVisible(false)
    setSelectedRecord(null)
    setRecordDetail(null)
  }

  // 表格列定义
  const columns = [
    {
      title: '记录ID',
      dataIndex: 'recordId',
      key: 'recordId',
      width: 100,
      ellipsis: true,
    },
    {
      title: '账户ID',
      dataIndex: 'accountId',
      key: 'accountId',
      width: 100,
      ellipsis: true,
    },
    {
      title: '订单ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 100,
      ellipsis: true,
      render: orderId => orderId ? (
        <Link to={`/orders?orderId=${orderId}`}>{orderId}</Link>
      ) : '-',
    },
    {
      title: '产品ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 100,
      ellipsis: true,
    },
    {
      title: '业务类型',
      dataIndex: 'bizType',
      key: 'bizType',
      width: 120,
      render: type => {
        const config = COMPUTE_TYPE_CONFIG[type] || { text: type, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '使用量',
      dataIndex: 'usedAmount',
      key: 'usedAmount',
      width: 100,
      render: amount => amount?.toLocaleString() ?? '-',
    },
    {
      title: '使用前余额',
      dataIndex: 'balanceBefore',
      key: 'balanceBefore',
      width: 120,
      render: balance => balance?.toLocaleString() ?? '-',
    },
    {
      title: '使用后余额',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 120,
      render: balance => balance?.toLocaleString() ?? '-',
    },
    {
      title: '业务ID',
      dataIndex: 'bizId',
      key: 'bizId',
      width: 100,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: time => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // 初始化加载
  useEffect(() => {
    fetchRecords()
  }, [])

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space wrap>
              <UserSelect
                value={searchParams.accountId}
                onChange={handleUserSelectChange}
                placeholder="搜索用户"
              />
              <Select
                placeholder="业务类型"
                style={{ width: 140 }}
                value={searchParams.bizType}
                onChange={value => setSearchParams({ ...searchParams, bizType: value })}
                allowClear
              >
                {LLM_COMPUTE_TYPES.map(type => (
                  <Option key={type} value={type}>{COMPUTE_TYPE_CONFIG[type]?.text}</Option>
                ))}
              </Select>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={records}
          rowKey="recordId"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
            size: 'small',
          }}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
          size="small"
        />
      </div>

      {/* 记录详情抽屉 */}
      <Drawer
        title="Token消耗记录详情"
        width={600}
        open={detailVisible}
        onClose={handleCloseDetail}
      >
        {recordDetail && (
          <>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="记录ID">{recordDetail.recordId}</Descriptions.Item>
                <Descriptions.Item label="账户ID">{recordDetail.accountId}</Descriptions.Item>
                <Descriptions.Item label="订单ID">
                  {recordDetail.orderId ? (
                    <Link to={`/orders?orderId=${recordDetail.orderId}`} target="_blank">
                      {recordDetail.orderId}
                    </Link>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="产品ID">{recordDetail.productId}</Descriptions.Item>
                <Descriptions.Item label="业务类型">
                  <Tag color={COMPUTE_TYPE_CONFIG[recordDetail.bizType]?.color || 'default'}>
                    {COMPUTE_TYPE_CONFIG[recordDetail.bizType]?.text || recordDetail.bizType}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="业务ID">{recordDetail.bizId || '-'}</Descriptions.Item>
                <Descriptions.Item label="使用量">{recordDetail.usedAmount?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="使用前余额">{recordDetail.balanceBefore?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="使用后余额">{recordDetail.balanceAfter?.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {recordDetail.createTime ? dayjs(recordDetail.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="创建人">{recordDetail.createBy}</Descriptions.Item>
              </Descriptions>
            </Card>

            {recordDetail.remark && (
              <Card size="small" title="备注" style={{ marginBottom: 16 }}>
                <div>{recordDetail.remark}</div>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}

export default TokenUsageRecordManagement
