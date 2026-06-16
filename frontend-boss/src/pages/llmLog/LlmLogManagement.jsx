import React, { useState, useEffect } from 'react'
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
import { getLlmLogPage, getLlmLogDetail } from '../../services/llmLog'
import { COMPUTE_TYPE_CONFIG, LLM_COMPUTE_TYPES } from '../../constants/computeType'
import UserSelect from '../../components/UserSelect'
import dayjs from 'dayjs'

const { Option } = Select

const LlmLogManagement = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [searchParams, setSearchParams] = useState({
    userId: '',
    bizType: undefined,
    startDate: null,
    endDate: null,
  })
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [logDetail, setLogDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  // 处理用户选择变化
  const handleUserSelectChange = user => {
    setSelectedUser(user)
    setSearchParams({ ...searchParams, userId: user?.userId || null, bizType: undefined })
  }

  // 获取日志列表
  const fetchLogs = async (params = {}) => {
    setLoading(true)
    try {
      const { pageNum = 1, pageSize = 20, ...rest } = params
      const response = await getLlmLogPage({
        pageNum,
        pageSize,
        ...searchParams,
        ...rest,
      })

      if (response.data) {
        setLogs(response.data || [])
        setPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total,
        })
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取日志详情
  const fetchLogDetail = async logId => {
    setDetailLoading(true)
    try {
      const response = await getLlmLogDetail(logId)
      if (response.data) {
        setLogDetail(response.data)
      }
    } catch (error) {
      console.error('Error fetching log detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  // 处理表格变化
  const handleTableChange = pagination => {
    fetchLogs({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    })
  }

  // 处理搜索
  const handleSearch = () => {
    fetchLogs({
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
  const handleViewDetail = log => {
    setSelectedLog(log)
    setDetailVisible(true)
    fetchLogDetail(log.logId)
  }

  // 关闭详情抽屉
  const handleCloseDetail = () => {
    setDetailVisible(false)
    setSelectedLog(null)
    setLogDetail(null)
  }

  // 表格列定义
  const columns = [
    {
      title: '日志ID',
      dataIndex: 'logId',
      key: 'logId',
      width: 100,
      ellipsis: true,
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      ellipsis: true,
      render: (text, record) => text || record.userId?.slice(0, 8) || '-',
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
      title: '业务ID',
      dataIndex: 'bizId',
      key: 'bizId',
      width: 120,
      ellipsis: true,
    },
    {
      title: '模型',
      dataIndex: 'model',
      key: 'model',
      width: 150,
      ellipsis: true,
    },
    {
      title: '输入Token',
      dataIndex: 'inputTokenCount',
      key: 'inputTokenCount',
      width: 100,
      render: count => count ?? '-',
    },
    {
      title: '输出Token',
      dataIndex: 'outputTokenCount',
      key: 'outputTokenCount',
      width: 100,
      render: count => count ?? '-',
    },
    {
      title: '总Token',
      dataIndex: 'totalTokenCount',
      key: 'totalTokenCount',
      width: 100,
      render: count => count ?? '-',
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
    fetchLogs()
  }, [])

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space wrap>
              <UserSelect
                value={searchParams.userId}
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
          dataSource={logs}
          rowKey="logId"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
            size: 'small',
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </div>

      {/* 日志详情抽屉 */}
      <Drawer
        title="LLM日志详情"
        width={800}
        open={detailVisible}
        onClose={handleCloseDetail}
      >
        {logDetail && (
          <>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="日志ID">{logDetail.logId}</Descriptions.Item>
                <Descriptions.Item label="用户">{logDetail.username || logDetail.userId}</Descriptions.Item>
                <Descriptions.Item label="业务类型">
                  <Tag color={COMPUTE_TYPE_CONFIG[logDetail.bizType]?.color || 'default'}>
                    {COMPUTE_TYPE_CONFIG[logDetail.bizType]?.text || logDetail.bizType}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="业务ID">{logDetail.bizId}</Descriptions.Item>
                <Descriptions.Item label="模型">{logDetail.model}</Descriptions.Item>
                <Descriptions.Item label="账户ID">{logDetail.accountId}</Descriptions.Item>
                <Descriptions.Item label="输入Token">{logDetail.inputTokenCount ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="输出Token">{logDetail.outputTokenCount ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="总Token">{logDetail.totalTokenCount ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {logDetail.createTime ? dayjs(logDetail.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="创建人">{logDetail.createBy}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="请求URL" style={{ marginBottom: 16 }}>
              <div style={{ wordBreak: 'break-all', fontSize: 12 }}>{logDetail.url || '-'}</div>
            </Card>

            <Card size="small" title="输入内容" style={{ marginBottom: 16 }}>
              <pre style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                maxHeight: 300,
                overflow: 'auto',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {logDetail.inputContent || '-'}
              </pre>
            </Card>

            <Card size="small" title="输出内容">
              <pre style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                maxHeight: 300,
                overflow: 'auto',
                fontSize: 12,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {logDetail.outputContent || '-'}
              </pre>
            </Card>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default LlmLogManagement
