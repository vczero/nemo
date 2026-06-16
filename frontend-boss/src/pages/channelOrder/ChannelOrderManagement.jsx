import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  DatePicker,
  Tag,
  Card,
  Row,
  Col,
  Drawer,
  Descriptions,
  Modal,
  Form,
  message,
  Tooltip,
  Radio
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlusOutlined,
  CopyOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import request from '../../utils/request'
import {
  getChannelOrderList,
  getChannelOrderDetail,
  createChannelOrder,
  getPlanOptions
} from '../../services/channelOrder'
import { getSysctl } from '../../services/systctl'

const SYSCTL_KEY = 'ORDER_CHANNEL_CONFIG'

const { Option } = Select
const { RangePicker } = DatePicker

// 通知消息模板
const NotificationMessages = {
  NEW_USER: (email) => `您是新用户，账号已经激活，请直接使用您的邮箱 ${email}，进行一遍注册流程，即可以使用。注册链接：https://ywllab.com/signup。`,
  OLD_USER: (email) => `订阅已经发送到您的账户，请直接使用您的邮箱 ${email}，进行登录，即可以使用。登录链接：https://ywllab.com/signin。`
}

const StatusMap = {
  PENDING_ACTIVATION: '待激活',
  ACTIVATED: '已激活',
  EXPIRED: '已过期'
}

const StatusColorMap = {
  PENDING_ACTIVATION: 'gold',
  ACTIVATED: 'green',
  EXPIRED: 'volcano'
}

const ChannelOrderTypeMap = {
  NEW_ACCOUNT: '开户',
  RENEWAL: '续期'
}

const ChannelOrderManagement = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0
  })
  const [filters, setFilters] = useState({
    status: null,
    email: '',
    channelOrderNo: '',
    startTime: null,
    endTime: null
  })
  const [planOptions, setPlanOptions] = useState([])
  const [channelConfigs, setChannelConfigs] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    channelName: '',
    channelOrderNo: '',
    channelOrderAmount: '',
    email: '',
    subscriptionPlanId: null,
    month: null
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [userQueryLoading, setUserQueryLoading] = useState(false)
  const [userQueryResult, setUserQueryResult] = useState(null)

  // 获取渠道配置列表
  const fetchChannelConfigs = async () => {
    try {
      const res = await getSysctl(SYSCTL_KEY)
      const value = res.data
      if (value) {
        const list = JSON.parse(value)
        setChannelConfigs(list)
      } else {
        setChannelConfigs([])
      }
    } catch (error) {
      console.error('获取渠道配置列表失败:', error)
    }
  }

  // 获取套餐列表
  const fetchPlanOptions = async () => {
    try {
      const response = await getPlanOptions()
      if (response.data) {
        const plans = response.data.list || response.data
        setPlanOptions(plans)
      }
    } catch (error) {
      console.error('获取套餐列表失败:', error)
    }
  }

  // 获取渠道订单列表
  const fetchOrders = async (pageNum = 1, pageSize = 15) => {
    setLoading(true)
    try {
      const params = {
        pageNum,
        pageSize,
        ...filters
      }

      // 移除空值
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key]
        }
      })

      const response = await getChannelOrderList(params)

      if (response.data) {
        setOrders(response.data || [])
        setPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total
        })
      }
    } catch (error) {
      message.error('获取渠道订单列表失败')
      console.error('Error fetching channel orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // 查看订单详情
  const handleViewDetail = async (order) => {
    setSelectedOrder(order)
    setDetailVisible(true)

    if (!order.subscriptionPlanId || !order.channelOrderType) {
      setDetailLoading(true)
      try {
        const response = await getChannelOrderDetail(order.orderId)
        if (response.data) {
          setSelectedOrder(response.data)
        }
      } catch (error) {
        message.error('获取渠道订单详情失败')
      } finally {
        setDetailLoading(false)
      }
    }
  }

  // 关闭详情抽屉
  const handleCloseDetail = () => {
    setDetailVisible(false)
    setSelectedOrder(null)
  }

  // 筛选变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({
      status: null,
      email: '',
      channelOrderNo: '',
      startTime: null,
      endTime: null
    })
  }

  // 搜索
  const handleSearch = () => {
    fetchOrders(1, pagination.pageSize)
  }

  // 刷新
  const handleRefresh = () => {
    fetchOrders(pagination.current, pagination.pageSize)
  }

  // 分页变化
  const handleTableChange = (newPagination) => {
    fetchOrders(newPagination.current, newPagination.pageSize)
  }

  // 打开创建弹窗
  const handleOpenCreateModal = () => {
    // 默认选中标准套餐
    const standardPlan = planOptions.find(p =>
      p.planName === '标准套餐' || p.planName.includes('标准')
    )
    setCreateFormData(prev => ({
      ...prev,
      subscriptionPlanId: standardPlan?.planId || null
    }))
    setCreateModalVisible(true)
  }

  // 关闭创建弹窗
  const handleCloseCreateModal = () => {
    setCreateModalVisible(false)
    setCreateFormData({
      channelName: '',
      channelOrderNo: '',
      channelOrderAmount: '',
      email: '',
      subscriptionPlanId: null,
      month: null
    })
    setUserQueryResult(null)
  }

  // 创建表单变化
  const handleCreateFormChange = (key, value) => {
    setCreateFormData(prev => {
      const newData = { ...prev, [key]: value }
      // 选择月份时自动填充供货价
      if (key === 'month' && value && prev.channelName) {
        const channelConfig = channelConfigs.find(c => c.name === prev.channelName)
        const priceItem = channelConfig?.price?.find(p => p.month === value)
        if (priceItem?.price) {
          newData.channelOrderAmount = priceItem.price
        }
      }
      // 输入邮箱时清除查询结果
      if (key === 'email') {
        setUserQueryResult(null)
      }
      return newData
    })
  }

  // 根据邮箱查询用户
  const handleQueryUser = async () => {
    if (!createFormData.email) {
      message.warning('请先输入邮箱')
      return
    }
    setUserQueryLoading(true)
    setUserQueryResult(null)
    try {
      const response = await request({
        url: '/boss/api/user/find-by-email',
        method: 'get',
        params: { email: createFormData.email },
      })
      if (response.data) {
        setUserQueryResult(response.data)
      }
    } catch (error) {
      console.error('查询用户失败:', error)
      message.error('查询用户失败')
    } finally {
      setUserQueryLoading(false)
    }
  }

  // 提交创建
  const handleCreate = async () => {
    if (!createFormData.channelName) {
      message.error('请选择渠道名称')
      return
    }
    if (!createFormData.month) {
      message.error('请选择月份')
      return
    }
    if (!createFormData.email) {
      message.error('请输入用户邮箱')
      return
    }
    if (!createFormData.subscriptionPlanId) {
      message.error('请选择订阅套餐')
      return
    }

    setCreateLoading(true)
    try {
      const data = {
        channelName: createFormData.channelName,
        channelOrderNo: createFormData.channelOrderNo,
        channelOrderAmount: parseFloat(createFormData.channelOrderAmount),
        email: createFormData.email,
        subscriptionPlanId: createFormData.subscriptionPlanId,
        subscriptionMonths: createFormData.month
      }
      await createChannelOrder(data)
      message.success('创建成功')
      handleCloseCreateModal()
      fetchOrders(1, pagination.pageSize)
    } catch (error) {
      message.error(error.message || '创建失败')
      console.error('Error creating channel order:', error)
    } finally {
      setCreateLoading(false)
    }
  }

  // 复制通知消息
  const handleCopyNotification = (type) => {
    const text = type === 'NEW_USER'
      ? NotificationMessages.NEW_USER(selectedOrder.email)
      : NotificationMessages.OLD_USER(selectedOrder.email)
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  // 初始化
  useEffect(() => {
    fetchChannelConfigs()
    fetchPlanOptions()
    fetchOrders()
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '订单ID',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 160,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '渠道名称',
      dataIndex: 'channelName',
      key: 'channelName',
      width: 80
    },
    {
      title: '用户邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 160,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '订阅月数',
      dataIndex: 'subscriptionMonths',
      key: 'subscriptionMonths',
      width: 80,
      render: (month) => {
        if (!month) return '-'
        const map = { 3: '3个月', 6: '6个月', 12: '1年', 24: '2年', 36: '3年' }
        return map[month] || month
      }
    },
    {
      title: '实付金额',
      dataIndex: 'channelOrderAmount',
      key: 'channelOrderAmount',
      width: 90,
      render: (text) => text ? `¥${parseFloat(text).toFixed(2)}` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={StatusColorMap[status] || 'default'}>
          {StatusMap[status] || status || '未知'}
        </Tag>
      )
    },
    {
      title: '订单类型',
      dataIndex: 'channelOrderType',
      key: 'channelOrderType',
      width: 80,
      render: (type) => ChannelOrderTypeMap[type] || type
    },
    {
      title: '发放时间',
      dataIndex: 'channelGrantTime',
      key: 'channelGrantTime',
      width: 160,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '激活时间',
      dataIndex: 'userActivationTime',
      key: 'userActivationTime',
      width: 160,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '渠道订单号',
      dataIndex: 'channelOrderNo',
      key: 'channelOrderNo',
      width: 120,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="channel-order-management">
      {/* 筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="用户邮箱"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.email}
            onChange={(e) => handleFilterChange('email', e.target.value)}
            allowClear
            onPressEnter={handleSearch}
          />

          <Input
            placeholder="渠道订单号"
            style={{ width: 180 }}
            value={filters.channelOrderNo}
            onChange={(e) => handleFilterChange('channelOrderNo', e.target.value)}
            allowClear
            onPressEnter={handleSearch}
          />

          <Select
            placeholder="订单状态"
            style={{ width: 120 }}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            allowClear
          >
            {Object.entries(StatusMap).map(([key, label]) => (
              <Option key={key} value={key}>{label}</Option>
            ))}
          </Select>

          <RangePicker
            value={filters.startTime && filters.endTime ? [dayjs(filters.startTime), dayjs(filters.endTime)] : null}
            onChange={(dates, dateStrings) => {
              handleFilterChange('startTime', dateStrings[0] || null)
              handleFilterChange('endTime', dateStrings[1] || null)
            }}
            placeholder={['发放开始日期', '发放结束日期']}
          />

          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>

          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>

          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateModal}>
            新增渠道订单
          </Button>
        </Space>
      </Card>

      {/* 订单表格 */}
      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="orderId"
        scroll={{ x: 1300 }}
        size="middle"
      />

      {/* 订单详情抽屉 */}
      <Drawer
        title="渠道订单详情"
        placement="right"
        width={720}
        onClose={handleCloseDetail}
        open={detailVisible}
      >
        {selectedOrder && (
          <>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="订单ID">{selectedOrder.orderId}</Descriptions.Item>
              <Descriptions.Item label="渠道名称">{selectedOrder.channelName}</Descriptions.Item>
              <Descriptions.Item label="渠道订单号">{selectedOrder.channelOrderNo || '-'}</Descriptions.Item>
              <Descriptions.Item label="实付金额">
                {selectedOrder.channelOrderAmount ? `¥${parseFloat(selectedOrder.channelOrderAmount).toFixed(2)}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="订单类型">
                {ChannelOrderTypeMap[selectedOrder.channelOrderType] || selectedOrder.channelOrderType}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={StatusColorMap[selectedOrder.status]}>
                  {StatusMap[selectedOrder.status] || selectedOrder.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="用户邮箱">{selectedOrder.email}</Descriptions.Item>
              <Descriptions.Item label="订阅套餐">
                {planOptions.find(p => p.planId === selectedOrder.subscriptionPlanId)?.planName || selectedOrder.subscriptionPlanId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="发放时间">
                {selectedOrder.channelGrantTime ? dayjs(selectedOrder.channelGrantTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="激活时间">
                {selectedOrder.userActivationTime ? dayjs(selectedOrder.userActivationTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{selectedOrder.creatorName || selectedOrder.createBy || '-'}</Descriptions.Item>
            </Descriptions>

            {/* 通知消息复制 */}
            <Card title="通知消息" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>
                    {selectedOrder.channelOrderType === 'NEW_ACCOUNT' ? '新用户通知' : '老用户续期通知'}：
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, padding: 8, background: 'rgba(0,0,0,0.05)', borderRadius: 4, fontSize: 12 }}>
                      {selectedOrder.channelOrderType === 'NEW_ACCOUNT'
                        ? NotificationMessages.NEW_USER(selectedOrder.email)
                        : NotificationMessages.OLD_USER(selectedOrder.email)}
                    </div>
                    <Button
                      type="primary"
                      icon={<CopyOutlined />}
                      onClick={() => handleCopyNotification(
                        selectedOrder.channelOrderType === 'NEW_ACCOUNT' ? 'NEW_USER' : 'OLD_USER'
                      )}
                      size="small"
                    >
                      复制
                    </Button>
                  </div>
                </div>
              </Space>
            </Card>
          </>
        )}
      </Drawer>

      {/* 创建渠道订单弹窗 */}
      <Modal
        title="新增渠道订单"
        open={createModalVisible}
        onCancel={handleCloseCreateModal}
        onOk={handleCreate}
        confirmLoading={createLoading}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="渠道名称"
            required
          >
            <Select
              placeholder="请选择渠道名称"
              value={createFormData.channelName || undefined}
              onChange={(value) => handleCreateFormChange('channelName', value)}
              showSearch
              optionFilterProp="children"
            >
              {channelConfigs.map(config => (
                <Option key={config.name} value={config.name}>{config.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="选择月份">
            {!createFormData.channelName ? (
              <span style={{ color: '#999' }}>请先选择渠道名称</span>
            ) : (
              <Radio.Group
                value={createFormData.month}
                onChange={(e) => handleCreateFormChange('month', e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio value={3}>
                  3个月 ¥{channelConfigs.find(c => c.name === createFormData.channelName)?.price?.find(p => p.month === 3)?.price || '-'}
                </Radio>
                <Radio value={6}>
                  6个月 ¥{channelConfigs.find(c => c.name === createFormData.channelName)?.price?.find(p => p.month === 6)?.price || '-'}
                </Radio>
                <Radio value={12}>
                  1年 ¥{channelConfigs.find(c => c.name === createFormData.channelName)?.price?.find(p => p.month === 12)?.price || '-'}
                </Radio>
                <Radio value={24}>
                  2年 ¥{channelConfigs.find(c => c.name === createFormData.channelName)?.price?.find(p => p.month === 24)?.price || '-'}
                </Radio>
                <Radio value={36}>
                  3年 ¥{channelConfigs.find(c => c.name === createFormData.channelName)?.price?.find(p => p.month === 36)?.price || '-'}
                </Radio>
              </Radio.Group>
            )}
          </Form.Item>

          <Form.Item
            label="订阅套餐"
            required
          >
            <Select
              placeholder="请选择订阅套餐"
              value={createFormData.subscriptionPlanId || undefined}
              onChange={(value) => handleCreateFormChange('subscriptionPlanId', value)}
              showSearch
              optionFilterProp="children"
            >
              {planOptions.map(plan => (
                <Option key={plan.planId} value={plan.planId}>
                  {plan.planName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="用户邮箱"
            required
          >
            <Input.Group compact style={{ display: 'flex' }}>
              <Input
                placeholder="请输入用户邮箱"
                value={createFormData.email}
                onChange={(e) => handleCreateFormChange('email', e.target.value)}
                style={{ flex: 1 }}
              />
              <Button
                icon={<SearchOutlined />}
                loading={userQueryLoading}
                onClick={handleQueryUser}
              >
                查询
              </Button>
            </Input.Group>
          </Form.Item>

          {userQueryResult && (
            <Form.Item>
              {userQueryResult.exists ? (
                <div style={{ color: '#52c41a', fontSize: 14 }}>
                  用户已存在 | 用户名称：{userQueryResult.nickname || userQueryResult.username} | 当前套餐到期时间：{userQueryResult.subscriptionEndTime ? dayjs(userQueryResult.subscriptionEndTime).format('YYYY-MM-DD') : '无'}
                </div>
              ) : (
                <div style={{ color: '#faad14', fontSize: 14 }}>
                  用户不存在，将创建新用户
                </div>
              )}
            </Form.Item>
          )}

          <Form.Item label="外部订单号ID">
            <Input
              placeholder="请输入外部订单号ID"
              value={createFormData.channelOrderNo}
              onChange={(e) => handleCreateFormChange('channelOrderNo', e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ChannelOrderManagement
