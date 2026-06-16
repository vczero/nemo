import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Select,
  message,
  Popconfirm,
  Tooltip,
  DatePicker,
  Input,
} from 'antd'
import {
  BellOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { getNotificationPage, batchDelete } from '../../services/notification'
import { getUserList } from '../../services/user'

const { RangePicker } = DatePicker
const { Option } = Select
const { Search } = Input

const UserNotificationManagement = () => {
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])

  // 用户列表（用于筛选指定用户）
  const [userList, setUserList] = useState([])
  const [userListLoading, setUserListLoading] = useState(false)

  // 筛选条件
  const [userIdFilter, setUserIdFilter] = useState(undefined)
  const [typeFilter, setTypeFilter] = useState(undefined) // SYSTEM, INVOICE, COMPUTE, OTHER
  const [statusFilter, setStatusFilter] = useState(undefined)
  const [priorityFilter, setPriorityFilter] = useState(undefined)
  const [dateRange, setDateRange] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')

  // 获取用户列表
  const fetchUserList = async () => {
    setUserListLoading(true)
    try {
      const res = await getUserList({ pageNum: 1, pageSize: 1000 })
      setUserList(res.data || [])
    } catch (error) {
      message.error('获取用户列表失败')
    } finally {
      setUserListLoading(false)
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const params = {
        pageNum: page,
        pageSize,
        types: typeFilter ? [typeFilter] : [],
        status: statusFilter ? [statusFilter] : [],
        priority: priorityFilter,
        targetUserId: userIdFilter,
      }

      // 添加时间范围
      if (dateRange && dateRange.length === 2) {
        params.startTime = dateRange[0].startOf('day').valueOf()
        params.endTime = dateRange[1].endOf('day').valueOf()
      }

      const res = await getNotificationPage(params)
      let list = res.data || []

      // 前端关键词搜索（如果后端不支持）
      if (searchKeyword) {
        list = list.filter(
          n =>
            n.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            n.content?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            n.userId?.toLowerCase().includes(searchKeyword.toLowerCase())
        )
      }

      setNotifications(list)
      setTotal(res.total || 0)
    } catch (error) {
      message.error('获取用户通知列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [page, pageSize, typeFilter, statusFilter, priorityFilter, userIdFilter, dateRange])

  useEffect(() => {
    fetchUserList()
  }, [])

  // 搜索确认
  const handleSearch = value => {
    setSearchKeyword(value)
    setPage(1)
  }

  // 重置筛选条件
  const handleReset = () => {
    setTypeFilter(undefined)
    setUserIdFilter(undefined)
    setStatusFilter(undefined)
    setPriorityFilter(undefined)
    setDateRange([])
    setSearchKeyword('')
    setPage(1)
  }

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的通知')
      return
    }

    try {
      await batchDelete({ notificationIds: selectedRowKeys })
      message.success(`成功删除${selectedRowKeys.length}条通知`)
      setSelectedRowKeys([])
      fetchNotifications()
    } catch (error) {
      message.error('批量删除失败')
    }
  }

  const handleDeleteSingle = async notificationId => {
    try {
      await batchDelete({ notificationIds: [notificationId] })
      message.success('删除成功')
      fetchNotifications()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleCopy = (text, type = '内容') => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${type}已复制: ${text}`)
    }).catch(() => {
      message.error('复制失败')
    })
  }

  const getPriorityColor = priority => {
    switch (priority) {
      case 'URGENT':
        return '#EF476F'
      case 'IMPORTANT':
        return '#FFD166'
      default:
        return '#06D6A0'
    }
  }

  const getPriorityText = priority => {
    switch (priority) {
      case 'URGENT':
        return '紧急'
      case 'IMPORTANT':
        return '重要'
      default:
        return '普通'
    }
  }

  const getStatusColor = status => {
    switch (status) {
      case 'READ':
        return '#06D6A0'
      case 'DELETED':
        return '#999'
      default:
        return '#00B4D8'
    }
  }

  const getStatusText = status => {
    switch (status) {
      case 'READ':
        return '已读'
      case 'DELETED':
        return '已删除'
      default:
        return '未读'
    }
  }

  const getTypeText = type => {
    switch (type) {
      case 'SYSTEM':
        return '系统'
      case 'INVOICE':
        return '发票'
      case 'COMPUTE':
        return '计算'
      case 'OTHER':
        return '其他'
      default:
        return type
    }
  }

  const getTypeColor = type => {
    switch (type) {
      case 'SYSTEM':
        return 'blue'
      case 'INVOICE':
        return 'green'
      case 'COMPUTE':
        return 'purple'
      case 'OTHER':
        return 'default'
      default:
        return 'default'
    }
  }

  // 统计数据
  const statistics = {
    total: total,
    unread: notifications.filter(n => n.status === 'UNREAD').length,
    read: notifications.filter(n => n.status === 'READ').length,
  }

  const columns = [
    {
      title: '用户',
      dataIndex: 'userName',
      width: 150,
      render: (userName, record) => (
        <Space size={4}>
          <Tooltip title={record.userId || '无'}>
            <span style={{ cursor: 'pointer' }}>
              {userName || record.userId || '无'}
            </span>
          </Tooltip>
          {record.userId && (
            <Tooltip title="复制用户ID">
              <CopyOutlined
                style={{ color: '#00d4ff', cursor: 'pointer', fontSize: 12 }}
                onClick={() => handleCopy(record.userId, '用户ID')}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 70,
      render: type => (
        <Tag color={getTypeColor(type)} style={{ borderRadius: 12, padding: '2px 6px', fontSize: 11 }}>
          {getTypeText(type)}
        </Tag>
      ),
    },
    { title: '标题', dataIndex: 'title', width: 120, ellipsis: true },
    {
      title: '内容',
      dataIndex: 'content',
      width: 180,
      ellipsis: true,
      render: text => (text?.length > 40 ? text.substring(0, 40) + '...' : text),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 70,
      render: priority => (
        <Tag
          color={getPriorityColor(priority)}
          style={{ borderRadius: 12, padding: '2px 8px', fontSize: 12 }}
        >
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 70,
      render: status => (
        <Tag
          color={getStatusColor(status)}
          style={{ borderRadius: 12, padding: '2px 8px', fontSize: 12 }}
        >
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      render: text => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Popconfirm
          title="确定删除该通知？"
          onConfirm={() => handleDeleteSingle(record.notificationId)}
        >
          <Button size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: keys => {
      setSelectedRowKeys(keys)
    },
  }

  return (
    <div>
      <div className="action-bar" style={{ padding: '8px 16px', marginBottom: 8 }}>
        <Space size="small" wrap>
          <Select
            placeholder="全部类型"
            style={{ width: 120 }}
            value={typeFilter}
            onChange={value => {
              setTypeFilter(value)
              setPage(1)
            }}
            allowClear
            size="small"
          >
            <Option value="SYSTEM">系统通知</Option>
            <Option value="INVOICE">开票通知</Option>
            <Option value="COMPUTE">计算任务</Option>
            <Option value="OTHER">其他</Option>
          </Select>

          <Select
            placeholder="选择用户"
            style={{ width: 180 }}
            value={userIdFilter}
            onChange={value => {
              setUserIdFilter(value)
              setPage(1)
            }}
            allowClear
            showSearch
            filterOption={(input, option) =>
              option?.children?.toLowerCase()?.includes(input.toLowerCase())
            }
            size="small"
          >
            {userList.map(user => (
              <Option key={user.userId} value={user.userId}>
                {user.nickname || user.username} ({user.email || user.phone || user.userId})
              </Option>
            ))}
          </Select>

          <RangePicker
            size="small"
            style={{ width: 240 }}
            value={dateRange}
            onChange={(dates, dateStrings) => {
              setDateRange(dates || [])
              setPage(1)
            }}
            placeholder={['开始时间', '结束时间']}
          />

          <Select
            placeholder="全部状态"
            style={{ width: 100 }}
            value={statusFilter}
            onChange={value => {
              setStatusFilter(value)
              setPage(1)
            }}
            allowClear
            size="small"
          >
            <Option value="UNREAD">未读</Option>
            <Option value="READ">已读</Option>
          </Select>

          <Select
            placeholder="优先级"
            style={{ width: 100 }}
            value={priorityFilter}
            onChange={value => {
              setPriorityFilter(value)
              setPage(1)
            }}
            allowClear
            size="small"
          >
            <Option value="NORMAL">普通</Option>
            <Option value="IMPORTANT">重要</Option>
            <Option value="URGENT">紧急</Option>
          </Select>

          <Search
            placeholder="搜索标题/内容/用户ID"
            onSearch={handleSearch}
            onChange={e => !e.target.value && handleSearch('')}
            style={{ width: 200 }}
            size="small"
            allowClear
            enterButton={
              <Button size="small" icon={<SearchOutlined />}>
                搜索
              </Button>
            }
          />

          <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>

          {selectedRowKeys.length > 0 && (
            <Popconfirm
              title={`确定删除选中的${selectedRowKeys.length}条通知？`}
              onConfirm={handleBatchDelete}
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                批量删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      <div style={{ padding: '8px 16px' }}>
        <Space size="small" wrap>
          {[
            { label: '总通知数', value: statistics.total, color: '#1890ff' },
            { label: '未读', value: statistics.unread, color: '#EF476F' },
            { label: '已读', value: statistics.read, color: '#06D6A0' },
          ].map(stat => (
            <div
              key={stat.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              <span style={{ color: '#999', fontSize: 12 }}>{stat.label}</span>
              <span style={{ color: stat.color, fontSize: 14, fontWeight: 500 }}>{stat.value || 0}</span>
            </div>
          ))}
        </Space>
      </div>

      <div className="table-container">
        <Table
          rowKey="notificationId"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={notifications}
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            size: 'small',
            onChange: (page, pageSize) => {
              setPage(page)
              setPageSize(pageSize)
            },
          }}
          size="small"
        />
      </div>
    </div>
  )
}

export default UserNotificationManagement