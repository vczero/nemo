import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  DatePicker,
  Tag,
  Card,
  Statistic,
  Row,
  Col,
  Drawer,
  Descriptions,
  Modal,
  message,
  Tooltip,
  Dropdown
} from 'antd'
import {
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
  EyeOutlined,
  FileExcelOutlined,
  FilterOutlined,
  ClearOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  ExpandOutlined,
  ShrinkOutlined,
  WalletOutlined,
  ShoppingOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getOrderList,
  getOrderDetail,
  getOrderStatistics,
  getUserOptions,
  getProductOptions,
  getPlanOptions,
  exportOrders,
  finishOrder
} from '../../services/order'

const { Option } = Select
const { RangePicker } = DatePicker
const { StatusMap, StatusColorMap } = {
  StatusMap: {
    UN_PAY: '待支付',
    PAID: '已支付',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    REFUNDED: '已退款',
    EXPIRED: '已过期'
  },
  StatusColorMap: {
    UN_PAY: 'gold',
    PAID: 'green',
    COMPLETED: 'blue',
    CANCELLED: 'default',
    REFUNDED: 'orange',
    EXPIRED: 'volcano'
  }
}

const OrderManagement = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    completed: 0,
    cancelled: 0
  })
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0
  })
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined,
    userId: undefined,
    productId: undefined,
    planId: undefined,
    startTime: null,
    endTime: null
  })
  const [userOptions, setUserOptions] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const [planOptions, setPlanOptions] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [filterExpanded, setFilterExpanded] = useState(false)
  const [drawerWidth, setDrawerWidth] = useState(900)
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false)

  // 解析订单快照，判断是否为流量包订单
  const parseOrderSnapshot = (record) => {
    try {
      const snapshot = typeof record.orderSnapshot === 'string'
        ? JSON.parse(record.orderSnapshot)
        : record.orderSnapshot
      return snapshot
    } catch {
      return null
    }
  }

  // 判断是否为流量包订单
  const isTokenPackOrder = (record) => {
    const snapshot = parseOrderSnapshot(record)
    if (!snapshot) return false
    // 单产品订单
    if (snapshot.product?.productType === 'TOKEN_PACK') return true
    // 套餐订单中的流量包产品
    if (snapshot.planProducts?.some(p => p.productType === 'TOKEN_PACK')) return true
    return false
  }

  // 流量包状态映射
  const TokenPackStatusMap = {
    ACTIVE: '有效',
    EXHAUSTED: '已用尽',
    EXPIRED: '已过期'
  }

  const TokenPackStatusColorMap = {
    ACTIVE: 'green',
    EXHAUSTED: 'orange',
    EXPIRED: 'volcano'
  }

  // 获取筛选选项
  const fetchFilterOptions = async () => {
    try {
      const [usersRes, productsRes, plansRes] = await Promise.all([
        getUserOptions({ keyword: '' }),
        getProductOptions(),
        getPlanOptions()
      ])

      if (usersRes.data) {
        setUserOptions(usersRes.data.list?.slice(0, 100) || usersRes.data.slice(0, 100))
      }
      if (productsRes.data) {
        setProductOptions(productsRes.data.list || productsRes.data)
      }
      if (plansRes.data) {
        setPlanOptions(plansRes.data.list || plansRes.data)
      }
    } catch (error) {
      console.error('获取筛选选项失败:', error)
    }
  }

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      const response = await getOrderStatistics()
      if (response.data) {
        setStatistics(response.data)
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  // 获取订单列表
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

      const response = await getOrderList(params)

      if (response.data) {
        setOrders(response.data || [])
        setPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total
        })
      }
    } catch (error) {
      message.error('获取订单列表失败')
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // 标记订单为支付完成（调试用）
  const handleFinishOrder = async (order) => {
    try {
      await finishOrder(order.orderId)
      message.success('订单已标记为支付完成')
      fetchOrders()
    } catch (error) {
      message.error('操作失败')
      console.error('Error finishing order:', error)
    }
  }

  // 查看订单详情
  const handleViewDetail = async (order) => {
    setSelectedOrder(order)
    setDetailVisible(true)

    // 如果详情不完整，重新获取
    if (!order.productSnapshot || !order.user) {
      setDetailLoading(true)
      try {
        const response = await getOrderDetail(order.orderId)
        if (response.data) {
          setSelectedOrder(response.data)
        }
      } catch (error) {
        message.error('获取订单详情失败')
      } finally {
        setDetailLoading(false)
      }
    }
  }

  // 关闭详情抽屉
  const handleCloseDetail = () => {
    setDetailVisible(false)
    setSelectedOrder(null)
    setDrawerWidth(900)
    setIsDrawerExpanded(false)
  }

  // 切换 Drawer 宽度
  const toggleDrawerWidth = () => {
    if (isDrawerExpanded) {
      setDrawerWidth(900)
    } else {
      setDrawerWidth(1200)
    }
    setIsDrawerExpanded(!isDrawerExpanded)
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
      keyword: '',
      status: '',
      userId: '',
      productId: '',
      planId: '',
      startTime: null,
      endTime: null
    })
  }

  // 跳转到套餐管理
  const handleNavigateToPlan = (planId) => {
    navigate('/subscription-plans', { state: { planId } })
  }

  // 搜索
  const handleSearch = () => {
    fetchOrders(1, pagination.pageSize)
  }

  // 导出订单
  const handleExport = async () => {
    try {
      const params = { ...filters }
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key]
        }
      })

      const response = await exportOrders(params)
      const blob = new Blob([response], { type: 'application/vnd.ms-excel' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `订单列表_${dayjs().format('YYYY-MM-DD')}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 刷新
  const handleRefresh = () => {
    fetchOrders(pagination.current, pagination.pageSize)
    fetchStatistics()
  }

  // 分页变化
  const handleTableChange = (newPagination) => {
    fetchOrders(newPagination.current, newPagination.pageSize)
  }

  // 初始化
  useEffect(() => {
    fetchFilterOptions()
    fetchStatistics()
    fetchOrders()
  }, [])

  // 处理 orderId 查询参数，自动打开订单详情
  useEffect(() => {
    const orderId = searchParams.get('orderId')
    if (orderId) {
      // 查找订单并打开详情
      const order = orders.find(o => o.orderId === orderId)
      if (order) {
        handleViewDetail(order)
      } else {
        // 订单不在当前页，直接通过API获取
        getOrderDetail(orderId).then(response => {
          if (response.data) {
            setSelectedOrder(response.data)
            setDetailVisible(true)
          }
        }).catch(() => {
          message.error('订单不存在')
        })
      }
    }
  }, [searchParams])

  // 表格列定义
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
      render: (text, record) => (
          <a onClick={() => handleViewDetail(record)}>{text}</a>
      )
    },
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'username',
      width: 120,
      render: (text, record) => text || record.userId || '-'
    },
    {
      title: '产品',
      dataIndex: ['productSnapshot', 'name'],
      key: 'productName',
      width: 150,
      render: (text, record) => {
        try {
          const snapshot = typeof record.orderSnapshot === 'string'
              ? JSON.parse(record.orderSnapshot)
              : record.orderSnapshot
          return snapshot?.product.productName || '-'
        } catch {
          return '-'
        }
      }
    },
    {
      title: '套餐',
      dataIndex: 'subscriptionPlanId',
      key: 'planId',
      width: 100,
      render: (subscriptionPlanId) => {
        const plan = planOptions.find(p=> p.planId === subscriptionPlanId)
        return (
            <a onClick={() => handleNavigateToPlan(subscriptionPlanId)} style={{ cursor: 'pointer' }}>
              {plan?.planName || subscriptionPlanId || '-'}
            </a>
        )
      }
    },
    {
      title: '金额',
      dataIndex: 'payAmount',
      key: 'payAmount',
      width: 100,
      render: (amount) => `¥${Number(amount || 0).toFixed(2)}`
    },
    {
      title: '优惠',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      width: 80,
      render: (amount) => `¥${Number(amount || 0).toFixed(2)}`
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
          <Tag color={StatusColorMap[status] || 'default'}>
            {StatusMap[status] || status || '未知'}
          </Tag>
      )
    },
    {
      title: '支付方式',
      dataIndex: 'payMethodDescription',
      key: 'payMethod',
      width: 100,
      render: (text, record) => record.payMethodDescription || record.payMethod || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '支付时间',
      dataIndex: 'paidTime',
      key: 'paidTime',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    // 流量包订单专属列
    {
      title: '剩余数量',
      dataIndex: 'tokenRemainingAmount',
      key: 'tokenRemainingAmount',
      width: 100,
      render: (amount, record) => {
        if (!isTokenPackOrder(record)) return '-'
        return record.tokenRemainingAmount ?? '-'
      }
    },
    {
      title: '流量包状态',
      dataIndex: 'tokenPackStatus',
      key: 'tokenPackStatus',
      width: 100,
      render: (status, record) => {
        if (!isTokenPackOrder(record)) return '-'
        return (
          <Tag color={TokenPackStatusColorMap[status] || 'default'}>
            {TokenPackStatusMap[status] || status || '未知'}
          </Tag>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
          <Space>
            {record.status === 'UN_PAY' && (
              <Tooltip title="标记为支付完成（调试）">
                <Button
                    type="link"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleFinishOrder(record)}
                />
              </Tooltip>
            )}
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
      <div className="order-management">
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                  title="全部订单"
                  value={statistics.total}
                  valueStyle={{ color: '#1890ff', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                  title="待支付"
                  value={statistics.pending}
                  valueStyle={{ color: '#faad14', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                  title="已支付"
                  value={statistics.paid}
                  valueStyle={{ color: '#52c41a', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                  title="已完成"
                  value={statistics.completed}
                  valueStyle={{ color: '#13c2c2', fontSize: 20 }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                  title="已取消"
                  value={statistics.cancelled}
                  valueStyle={{ color: '#d9d9d9', fontSize: 20 }}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
                placeholder="订单号/用户"
                prefix={<SearchOutlined />}
                style={{ width: 200 }}
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
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

            <Select
                placeholder="产品"
                style={{ width: 150 }}
                value={filters.productId}
                onChange={(value) => handleFilterChange('productId', value)}
                allowClear
                showSearch
                optionFilterProp="children"
            >
              {productOptions.map(product => (
                  <Option key={product.id || product.productId} value={product.id || product.productId}>
                    {product.name}
                  </Option>
              ))}
            </Select>

            <Select
                placeholder="套餐"
                style={{ width: 150 }}
                value={filters.planId}
                onChange={(value) => handleFilterChange('planId', value)}
                allowClear
                showSearch
                optionFilterProp="children"
            >
              {planOptions.map(plan => (
                  <Option key={plan.id || plan.planId} value={plan.id || plan.planId}>
                    {plan.name}
                  </Option>
              ))}
            </Select>

            <Select
                placeholder="用户"
                style={{ width: 150 }}
                value={filters.userId}
                onChange={(value) => handleFilterChange('userId', value)}
                allowClear
                showSearch
                optionFilterProp="children"
            >
              {userOptions.map(user => (
                  <Option key={user.id || user.userId} value={user.id || user.userId}>
                    {user.username || user.email}
                  </Option>
              ))}
            </Select>

            <RangePicker
                value={filters.startTime && filters.endTime ? [dayjs(filters.startTime), dayjs(filters.endTime)] : null}
                onChange={(dates, dateStrings) => {
                  handleFilterChange('startTime', dateStrings[0] || null)
                  handleFilterChange('endTime', dateStrings[1] || null)
                }}
                placeholder={['开始日期', '结束日期']}
            />

            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>

            <Button icon={<ClearOutlined />} onClick={handleResetFilters}>
              重置
            </Button>

            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              导出
            </Button>

            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
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
            title="订单详情"
            placement="right"
            width={drawerWidth}
            onClose={handleCloseDetail}
            open={detailVisible}
            extra={
              <Space>
                <Button
                  icon={isDrawerExpanded ? <ShrinkOutlined /> : <ExpandOutlined />}
                  onClick={toggleDrawerWidth}
                >
                  {isDrawerExpanded ? '收起' : '展开'}
                </Button>
                <Button type="primary" onClick={() => window.print()}>
                  打印
                </Button>
              </Space>
            }
        >
          {selectedOrder && (
            <div>
              {/* 订单状态卡片 */}
              <Card size="small" title="订单状态" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>订单编号：</span>
                      <span style={{ fontWeight: 500 }}>{selectedOrder.orderNo}</span>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>订单状态：</span>
                      <Tag color={StatusColorMap[selectedOrder.status]} style={{ marginLeft: 4 }}>
                        {StatusMap[selectedOrder.status] || selectedOrder.status}
                      </Tag>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>支付方式：</span>
                      <span>{selectedOrder.payMethodDescription || selectedOrder.payMethod || '-'}</span>
                    </div>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>创建时间：</span>
                      <span>{selectedOrder.createTime ? dayjs(selectedOrder.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</span>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>支付时间：</span>
                      <span>{selectedOrder.paidTime ? dayjs(selectedOrder.paidTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</span>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>过期时间：</span>
                      <span>{selectedOrder.expireTime ? dayjs(selectedOrder.expireTime).format('YYYY-MM-DD HH:mm:ss') : '-'}</span>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* 用户和产品信息 */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                {/* 用户信息卡片 */}
                <Col span={isDrawerExpanded ? 12 : 24}>
                  <Card size="small" title="用户信息" extra={<InfoCircleOutlined />}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#666' }}>用户名：</span>
                          <span>{selectedOrder.user?.username || selectedOrder.userId || '-'}</span>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: 13 }}>
                          <span style={{ color: '#666' }}>邮箱：</span>
                          <span>{selectedOrder.user?.email || '-'}</span>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {isDrawerExpanded && (
                  <Col span={12}>
                    <Card size="small" title="产品信息" extra={<ShoppingOutlined />}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ fontSize: 13 }}>
                            <span style={{ color: '#666' }}>产品名称：</span>
                            <span>
                              {(() => {
                                try {
                                  const snapshot = typeof selectedOrder.productSnapshot === 'string'
                                    ? JSON.parse(selectedOrder.productSnapshot)
                                    : selectedOrder.productSnapshot
                                  return snapshot?.name || '-'
                                } catch {
                                  return '-'
                                }
                              })()}
                            </span>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ fontSize: 13 }}>
                            <span style={{ color: '#666' }}>套餐：</span>
                            <span>
                              {(() => {
                                const plan = planOptions.find(p => p.planId === selectedOrder.subscriptionPlanId)
                                if (plan && selectedOrder.subscriptionPlanId) {
                                  return (
                                    <a onClick={() => handleNavigateToPlan(selectedOrder.subscriptionPlanId)} style={{ cursor: 'pointer' }}>
                                      {plan.planName || selectedOrder.subscriptionPlanId || '-'}
                                    </a>
                                  )
                                }
                                return selectedOrder.subscriptionPlanId || '-'
                              })()}
                            </span>
                          </div>
                        </Col>
                      </Row>
                      <Row gutter={16} style={{ marginTop: 8 }}>
                        <Col span={12}>
                          <div style={{ fontSize: 13 }}>
                            <span style={{ color: '#666' }}>购买数量：</span>
                            <span>{selectedOrder.quantity || 1}</span>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                )}
              </Row>

              {/* 金额信息统计卡片 */}
              <Card size="small" title="金额信息" style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col span={isDrawerExpanded ? 6 : 6}>
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                      <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>原价</div>
                      <div style={{ color: '#666', fontSize: 18 }}>¥{Number(selectedOrder.originalAmount || 0).toFixed(2)}</div>
                    </div>
                  </Col>
                  <Col span={isDrawerExpanded ? 6 : 6}>
                    <div style={{ textAlign: 'center', padding: '8px 0', borderLeft: '1px solid #f0f0f0' }}>
                      <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>优惠</div>
                      <div style={{ color: '#52c41a', fontSize: 18 }}>-¥{Number(selectedOrder.discountAmount || 0).toFixed(2)}</div>
                    </div>
                  </Col>
                  <Col span={isDrawerExpanded ? 6 : 6}>
                    <div style={{ textAlign: 'center', padding: '8px 0', borderLeft: '1px solid #f0f0f0' }}>
                      <div style={{ color: '#999', fontSize: 12, marginBottom: 4 }}>积分抵扣</div>
                      <div style={{ color: '#fa8c16', fontSize: 18 }}>-¥{Number(selectedOrder.pointsDeductAmount || 0).toFixed(2)}</div>
                    </div>
                  </Col>
                  <Col span={isDrawerExpanded ? 6 : 6}>
                    <div style={{ textAlign: 'center', padding: '8px 0', borderLeft: '1px solid #f0f0f0', background: '#fff2f0', borderRadius: 4 }}>
                      <div style={{ color: '#ff4d4f', fontSize: 12, marginBottom: 4 }}>实付金额</div>
                      <div style={{ color: '#ff4d4f', fontSize: 22, fontWeight: 'bold' }}>¥{Number(selectedOrder.payAmount || 0).toFixed(2)}</div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* 流量包订单信息 */}
              {isTokenPackOrder(selectedOrder) && (
                <Card size="small" title="流量包信息" style={{ marginBottom: 16 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: '#666' }}>剩余数量：</span>
                        <span>{selectedOrder.tokenRemainingAmount ?? '-'}</span>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: 13 }}>
                        <span style={{ color: '#666' }}>流量包状态：</span>
                        <Tag color={TokenPackStatusColorMap[selectedOrder.tokenPackStatus] || 'default'}>
                          {TokenPackStatusMap[selectedOrder.tokenPackStatus] || selectedOrder.tokenPackStatus || '未知'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </Card>
              )}

              {/* 备注信息 */}
              <Card size="small" title="备注" style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {selectedOrder.remark || '无备注'}
                </div>
              </Card>
            </div>
          )}
        </Drawer>
      </div>
  )
}

export default OrderManagement
