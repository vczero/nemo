import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip,
  Radio,
} from 'antd'
import {
  PlusOutlined,
  BellOutlined,
  DeleteOutlined,
  EditOutlined,
  SendOutlined,
  CopyOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import {
  getNotificationPage,
  sendNotification,
  updateNotification,
  batchDelete,
} from '../services/notification'
import { getUserList } from '../services/user'

const { TextArea } = Input
const { Option } = Select

const NotificationManagement = () => {
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [selectedItems, setSelectedItems] = useState([])

  // 用户列表（用于选择指定用户）
  const [userList, setUserList] = useState([])
  const [userListLoading, setUserListLoading] = useState(false)

  // 新建/编辑模态框
  const [modalVisible, setModalVisible] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [sendScope, setSendScope] = useState('all') // 'all' or 'specified'
  const [form] = Form.useForm()

  // 状态筛选
  const [statusFilter, setStatusFilter] = useState([])
  const [priorityFilter, setPriorityFilter] = useState(undefined)

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
      const res = await getNotificationPage({
        pageNum: page,
        pageSize,
        status: statusFilter.length > 0 ? statusFilter : undefined,
        priority: priorityFilter,
      })
      setNotifications(res.data || [])
      setTotal(res.total || 0)
    } catch (error) {
      message.error('获取系统通知列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchUserList()
  }, [page, pageSize, statusFilter, priorityFilter])

  const handleOpenCreateModal = () => {
    setModalMode('create')
    setEditingRecord(null)
    setSendScope('all')
    form.resetFields()
    form.setFieldsValue({ scope: 'all', priority: 'NORMAL' })
    setModalVisible(true)
  }

  const handleOpenEditModal = record => {
    setModalMode('edit')
    setEditingRecord(record)
    form.setFieldsValue({
      title: record.title,
      content: record.content,
      priority: record.priority,
      linkUrl: record.linkUrl || '',
    })
    setModalVisible(true)
  }

  const handleModalOk = async () => {
    setModalLoading(true)
    try {
      const values = await form.validateFields()

      if (modalMode === 'create') {
        const payload = {
          title: values.title,
          content: values.content,
          priority: values.priority || 'NORMAL',
          linkUrl: values.linkUrl || null,
        }

        // 如果选择指定用户，添加userIds
        if (sendScope === 'specified' && values.userIds?.length > 0) {
          payload.userIds = values.userIds
        }

        const res = await sendNotification(payload)
        message.success(res.data?.message || '系统通知发送成功')
      } else {
        await updateNotification(editingRecord.notificationId, {
          userId: editingRecord.userId,
          type: 'SYSTEM',
          title: values.title,
          content: values.content,
          priority: values.priority || 'NORMAL',
          linkUrl: values.linkUrl || null,
        })
        message.success('通知更新成功')
      }

      setModalVisible(false)
      form.resetFields()
      setEditingRecord(null)
      fetchNotifications()
    } catch (error) {
      if (error.errorFields) {
        // 表单验证错误
        return
      }
      message.error(modalMode === 'create' ? '发送通知失败' : '更新通知失败')
    } finally {
      setModalLoading(false)
    }
  }

  const handleModalCancel = () => {
    setModalVisible(false)
    form.resetFields()
    setEditingRecord(null)
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
      setSelectedItems([])
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
      default:
        return '#00B4D8'
    }
  }

  const getStatusText = status => {
    switch (status) {
      case 'READ':
        return '已读'
      default:
        return '未读'
    }
  }

  // 统计数据
  const statistics = {
    total: total,
    unread: notifications.filter(n => n.status === 'UNREAD').length,
    read: notifications.filter(n => n.status === 'READ').length,
  }

  const columns = [
    { title: 'ID', dataIndex: 'notificationId', width: 200, ellipsis: true },
    {
      title: '接收用户',
      dataIndex: 'userName',
      width: 200,
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
    { title: '标题', dataIndex: 'title', width: 200, ellipsis: true },
    {
      title: '内容',
      dataIndex: 'content',
      width: 300,
      ellipsis: true,
      render: text => (text?.length > 50 ? text.substring(0, 50) + '...' : text),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 100,
      render: priority => (
        <Tag
          color={getPriorityColor(priority)}
          style={{
            borderRadius: 12,
            padding: '2px 10px',
            fontSize: 12,
          }}
        >
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: status => (
        <Tag
          color={getStatusColor(status)}
          style={{
            borderRadius: 12,
            padding: '2px 10px',
            fontSize: 12,
          }}
        >
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      render: text => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该通知？"
            onConfirm={() => handleDeleteSingle(record.notificationId)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys)
      setSelectedItems(rows)
    },
  }

  return (
    <div>
      <Row gutter={12} className="stats-row" style={{ marginBottom: 8 }}>
        <Col span={8}>
          <Statistic
            title="总通知数"
            value={statistics.total}
            prefix={<BellOutlined style={{ color: '#007acc', fontSize: 13 }} />}
            valueStyle={{ color: '#d4d4d4', fontWeight: 600, fontSize: 17 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="未读"
            value={statistics.unread}
            prefix={<SendOutlined style={{ color: '#EF476F', fontSize: 13 }} />}
            valueStyle={{ color: '#d4d4d4', fontWeight: 600, fontSize: 17 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="已读"
            value={statistics.read}
            prefix={<SendOutlined style={{ color: '#06D6A0', fontSize: 13 }} />}
            valueStyle={{ color: '#d4d4d4', fontWeight: 600, fontSize: 17 }}
          />
        </Col>
      </Row>

      <div className="action-bar" style={{ padding: '8px 16px' }}>
        <Space size="small" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size="small">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenCreateModal}
              size="small"
            >
              发送系统通知
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
          <Space size="small">
            <Select
              mode="multiple"
              placeholder="全部状态"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={value => {
                setStatusFilter(value)
                setPage(1)
              }}
              allowClear
              maxTagCount={1}
              size="small"
            >
              <Option value="UNREAD">未读</Option>
              <Option value="READ">已读</Option>
            </Select>
            <Select
              placeholder="全部优先级"
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
          </Space>
        </Space>
      </div>

      <div className="table-container">
        <Table
          rowKey="notificationId"
          rowSelection={rowSelection}
          columns={columns}
          dataSource={notifications}
          loading={loading}
          scroll={{ x: 1400 }}
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

      {/* 新建/编辑模态框 */}
      <Modal
        title={modalMode === 'create' ? '发送系统通知' : '编辑系统通知'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText={modalMode === 'create' ? '发送' : '保存'}
        cancelText="取消"
        confirmLoading={modalLoading}
      >
        <Form form={form} layout="vertical">
          {modalMode === 'create' && (
            <Form.Item label="发送对象">
              <Radio.Group
                value={sendScope}
                onChange={e => {
                  setSendScope(e.target.value)
                  if (e.target.value === 'all') {
                    form.setFieldsValue({ userIds: [] })
                  }
                }}
                style={{ width: '100%' }}
              >
                <Radio value="all">
                  <Space>
                    <BellOutlined />
                    所有用户
                  </Space>
                </Radio>
                <Radio value="specified" style={{ marginLeft: 24 }}>
                  <Space>
                    <TeamOutlined />
                    指定用户
                  </Space>
                </Radio>
              </Radio.Group>
            </Form.Item>
          )}

          {modalMode === 'create' && sendScope === 'specified' && (
            <Form.Item
              name="userIds"
              label="选择用户"
              rules={[{ required: true, message: '请选择至少一个用户' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择接收通知的用户"
                loading={userListLoading}
                showSearch
                filterOption={(input, option) =>
                  option?.children?.toLowerCase()?.includes(input.toLowerCase())
                }
                maxTagCount={5}
                style={{ width: '100%' }}
              >
                {userList.map(user => (
                  <Option key={user.userId} value={user.userId}>
                    {user.nickname || user.username} ({user.email || user.phone || user.userId})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="title"
            label="通知标题"
            rules={[
              { required: true, message: '请输入通知标题' },
              { max: 100, message: '标题最多100个字符' },
            ]}
          >
            <Input placeholder="请输入通知标题" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="content"
            label="通知内容"
            rules={[
              { required: true, message: '请输入通知内容' },
              { max: 2000, message: '内容最多2000个字符' },
            ]}
          >
            <TextArea
              placeholder="请输入通知内容"
              rows={6}
              maxLength={2000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            initialValue="NORMAL"
          >
            <Select>
              <Option value="NORMAL">普通</Option>
              <Option value="IMPORTANT">重要</Option>
              <Option value="URGENT">紧急</Option>
            </Select>
          </Form.Item>

          <Form.Item name="linkUrl" label="跳转链接（可选）">
            <Input placeholder="https://example.com" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default NotificationManagement
