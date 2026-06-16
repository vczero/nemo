import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Tag,
  Drawer,
  Descriptions,
  Card,
  Row,
  Col,
  Statistic,
  Popconfirm,
  Tooltip,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  FileTextOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { getTaskPage, getTaskDetail, retryTask, getTaskStatistics } from '../../services/computeTask'
import { COMPUTE_TYPE_CONFIG, COMPUTE_TYPE_OPTIONS } from '../../constants/computeType'
import UserSelect from '../../components/UserSelect'
import dayjs from 'dayjs'

const { Option } = Select

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '-'
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// 任务状态配置
const STATUS_CONFIG = {
  PENDING: { color: 'default', text: '待处理', icon: <ClockCircleOutlined /> },
  RUNNING: { color: 'processing', text: '执行中', icon: <LoadingOutlined /> },
  SUCCESS: { color: 'success', text: '成功', icon: <CheckCircleOutlined /> },
  FAILED: { color: 'error', text: '失败', icon: <CloseCircleOutlined /> },
  CANCELLED: { color: 'default', text: '已取消', icon: <CloseCircleOutlined /> },
}

const ComputeTaskManagement = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [searchParams, setSearchParams] = useState({
    userId: '',
    endpointType: undefined,
    taskStatus: undefined,
    taskName: '',
  })
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskDetail, setTaskDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [statistics, setStatistics] = useState(null)

  // 处理用户选择变化
  const handleUserSelectChange = user => {
    setSelectedUser(user)
    setSearchParams({ ...searchParams, userId: user?.userId || '' })
  }

  // 获取任务统计
  const fetchStatistics = async () => {
    try {
      const response = await getTaskStatistics()
      if (response.data) {
        setStatistics(response.data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  // 获取任务列表
  const fetchTasks = async (params = {}) => {
    setLoading(true)
    try {
      const { pageNum = 1, pageSize = 20, ...rest } = params
      const response = await getTaskPage({
        pageNum,
        pageSize,
        ...searchParams,
        ...rest,
      })

      if (response.data) {
        setTasks(response.data || [])
        setPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total,
        })
      }
    } catch (error) {
      message.error('获取任务列表失败')
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取任务详情
  const fetchTaskDetail = async taskId => {
    setDetailLoading(true)
    try {
      const response = await getTaskDetail(taskId)
      if (response.data) {
        setTaskDetail(response.data)
      }
    } catch (error) {
      message.error('获取任务详情失败')
      console.error('Error fetching task detail:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  // 重试任务
  const handleRetry = async taskId => {
    setRetrying(true)
    try {
      await retryTask(taskId)
      message.success('任务重试成功')
      fetchTasks({
        pageNum: pagination.current,
        pageSize: pagination.pageSize,
      })
      // 如果详情抽屉是打开的且是同一个任务，刷新详情
      if (detailVisible && selectedTask?.taskId === taskId) {
        fetchTaskDetail(taskId)
      }
    } catch (error) {
      message.error('任务重试失败')
      console.error('Error retrying task:', error)
    } finally {
      setRetrying(false)
    }
  }

  // 处理表格变化
  const handleTableChange = (pagination) => {
    fetchTasks({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
    })
  }

  // 处理搜索
  const handleSearch = () => {
    fetchTasks({
      pageNum: 1,
      pageSize: pagination.pageSize,
    })
  }

  // 重置搜索
  const handleReset = () => {
    setSearchParams({
      userId: '',
      endpointType: undefined,
      taskStatus: undefined,
      taskName: '',
    })
    setSelectedUser(null)
    fetchTasks({
      pageNum: 1,
      pageSize: pagination.pageSize,
    })
  }

  // 点击状态卡片过滤
  const handleStatusFilter = status => {
    setSearchParams({ ...searchParams, taskStatus: status })
    fetchTasks({
      pageNum: 1,
      pageSize: pagination.pageSize,
      taskStatus: status,
    })
  }

  // 查看详情
  const handleViewDetail = task => {
    setSelectedTask(task)
    setDetailVisible(true)
    fetchTaskDetail(task.taskId)
  }

  // 关闭详情抽屉
  const handleCloseDetail = () => {
    setDetailVisible(false)
    setSelectedTask(null)
    setTaskDetail(null)
  }

  // 状态卡片配置
  const statusCards = [
    { key: undefined, label: '全部', value: statistics?.total, color: 'blue' },
    { key: 'PENDING', label: '待处理', value: statistics?.pending, color: 'default' },
    { key: 'RUNNING', label: '执行中', value: statistics?.running, color: 'processing' },
    { key: 'SUCCESS', label: '成功', value: statistics?.success, color: 'success' },
    { key: 'FAILED', label: '失败', value: statistics?.failed, color: 'error' },
    { key: 'CANCELLED', label: '取消', value: statistics?.cancelled, color: 'default' },
  ]

  // 表格列定义
  const columns = [
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
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
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 150,
      ellipsis: true,
      render: text => text || '-',
    },
    {
      title: '计算类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 120,
      render: type => {
        const config = COMPUTE_TYPE_CONFIG[type] || { text: type, color: 'default' }
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '任务状态',
      dataIndex: 'taskStatus',
      key: 'taskStatus',
      width: 100,
      render: status => {
        const config = STATUS_CONFIG[status] || { text: status, color: 'default', icon: null }
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      },
    },
    {
      title: '耗时',
      key: 'duration',
      width: 100,
      render: (_, record) => {
        if (!record.startTime) return '-'
        const end = record.endTime || Date.now()
        const duration = end - record.startTime
        if (duration < 1000) return `${duration}ms`
        if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
        if (duration < 3600000) return `${(duration / 60000).toFixed(1)}m`
        return `${(duration / 3600000).toFixed(1)}h`
      },
    },
    {
      title: '重试次数',
      dataIndex: 'retryCount',
      key: 'retryCount',
      width: 80,
      render: count => count || 0,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: time => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: time => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      width: 150,
      ellipsis: true,
      render: text => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.taskStatus === 'FAILED' && (
            <Popconfirm
              title="确定要重试此任务吗？"
              onConfirm={() => handleRetry(record.taskId)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                icon={<SyncOutlined spin={retrying} />}
                loading={retrying}
                title="重试"
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  // 初始化加载
  useEffect(() => {
    fetchTasks()
    fetchStatistics()
  }, [])

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Space wrap>
              <UserSelect
                value={searchParams.userId}
                onChange={handleUserSelectChange}
                placeholder="搜索用户"
              />
              <Select
                placeholder="计算类型"
                style={{ width: 140 }}
                value={searchParams.endpointType}
                onChange={value => setSearchParams({ ...searchParams, endpointType: value })}
                allowClear
              >
                {COMPUTE_TYPE_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
              <Select
                placeholder="任务状态"
                style={{ width: 120 }}
                value={searchParams.taskStatus}
                onChange={value => setSearchParams({ ...searchParams, taskStatus: value })}
                allowClear
              >
                <Option value="PENDING">待处理</Option>
                <Option value="RUNNING">执行中</Option>
                <Option value="SUCCESS">执行成功</Option>
                <Option value="FAILED">执行失败</Option>
                <Option value="CANCELLED">已取消</Option>
              </Select>
              <Input
                placeholder="任务名称(模糊)/任务ID(精确)"
                style={{ width: 200 }}
                value={searchParams.taskName}
                onChange={e => setSearchParams({ ...searchParams, taskName: e.target.value })}
                allowClear
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
          <Col>
            <Space size="small" style={{ flexWrap: 'nowrap' }}>
              {statusCards.map(card => (
                <div
                  key={card.key}
                  onClick={() => handleStatusFilter(card.key)}
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: searchParams.taskStatus === card.key ? 'rgba(24, 144, 255, 0.2)' : 'transparent',
                    border: searchParams.taskStatus === card.key ? '1px solid #1890ff' : '1px solid transparent',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ color: '#999', fontSize: 12 }}>{card.label}</span>
                  <span style={{
                    color: card.color === 'processing' ? '#1890ff' : card.color === 'success' ? '#52c41a' : card.color === 'error' ? '#ff4d4f' : '#333',
                    fontSize: 14,
                    fontWeight: 500
                  }}>{card.value || 0}</span>
                </div>
              ))}
            </Space>
          </Col>
        </Row>
      </Card>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="taskId"
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

      {/* 任务详情抽屉 */}
      <Drawer
        title="任务详情"
        width={600}
        open={detailVisible}
        onClose={handleCloseDetail}
      >
        {taskDetail && (
          <>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="任务ID">{taskDetail.taskId}</Descriptions.Item>
                <Descriptions.Item label="任务名称">
                  {taskDetail.taskName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="计算类型">
                  <Tag color={COMPUTE_TYPE_CONFIG[taskDetail.taskType]?.color || 'default'}>
                    {COMPUTE_TYPE_CONFIG[taskDetail.taskType]?.text || taskDetail.taskType}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="任务状态">
                  <Tag color={STATUS_CONFIG[taskDetail.taskStatus]?.color || 'default'}>
                    {STATUS_CONFIG[taskDetail.taskStatus]?.text || taskDetail.taskStatus}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="重试次数">{taskDetail.retryCount || 0}</Descriptions.Item>
                <Descriptions.Item label="开始时间">
                  {taskDetail.startTime
                    ? dayjs(taskDetail.startTime).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="结束时间">
                  {taskDetail.endTime
                    ? dayjs(taskDetail.endTime).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="耗时">
                  {taskDetail.startTime
                    ? (() => {
                        const end = taskDetail.endTime || Date.now()
                        const duration = end - taskDetail.startTime
                        if (duration < 1000) return `${duration}ms`
                        if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`
                        if (duration < 3600000) return `${(duration / 60000).toFixed(1)}m`
                        return `${(duration / 3600000).toFixed(1)}h`
                      })()
                    : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {taskDetail.errorMessage && (
              <Card size="small" title="错误信息" style={{ marginBottom: 16 }}>
                <div style={{ color: '#ff4d4f' }}>{taskDetail.errorMessage}</div>
              </Card>
            )}

            <Card size="small" title="输入文件" style={{ marginBottom: 12 }}>
              {taskDetail.inputFiles && taskDetail.inputFiles.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {taskDetail.inputFiles.map((file, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '4px 8px 4px 0', whiteSpace: 'nowrap' }}>
                          <FileTextOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                          <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                            {file.name || file.fileId}
                          </a>
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap', width: 70 }}>{formatFileSize(file.fileSize)}</td>
                        <td style={{ padding: '4px 0', textAlign: 'right', whiteSpace: 'nowrap', width: 150 }}>{file.createTime ? dayjs(file.createTime).format('YYYY-MM-DD HH:mm') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ color: '#999' }}>无</div>}
            </Card>

            <Card size="small" title="结果文件" style={{ marginBottom: 16 }}>
              {taskDetail.outputFiles && taskDetail.outputFiles.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {taskDetail.outputFiles.map((file, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '4px 8px 4px 0', whiteSpace: 'nowrap' }}>
                          <FileTextOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                          <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                            {file.name || file.fileId}
                          </a>
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap', width: 70 }}>{formatFileSize(file.fileSize)}</td>
                        <td style={{ padding: '4px 0', textAlign: 'right', whiteSpace: 'nowrap', width: 150 }}>{file.createTime ? dayjs(file.createTime).format('YYYY-MM-DD HH:mm') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div style={{ color: '#999' }}>无</div>}
            </Card>

            {taskDetail.summary && Object.keys(taskDetail.summary).length > 0 && (
              <Card size="small" title="任务摘要" style={{ marginBottom: 16 }}>
                <Descriptions column={2} size="small">
                  {Object.entries(taskDetail.summary).map(([key, value]) => (
                    <Descriptions.Item key={key} label={key}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}

            {taskDetail.taskParams && Object.keys(taskDetail.taskParams).length > 0 && (
              <Card size="small" title="任务参数">
                <pre style={{
                  fontSize: 12,
                  background: 'var(--ant-color-bg-container, #f5f5f5)',
                  color: 'var(--ant-color-text, #1a1a1a)',
                  padding: 12,
                  borderRadius: 4,
                  margin: 0
                }}>
                  {JSON.stringify(taskDetail.taskParams, null, 2)}
                </pre>
              </Card>
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}

export default ComputeTaskManagement
