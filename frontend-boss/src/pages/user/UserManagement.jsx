import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Modal,
  Form,
  message,
  Descriptions,
  Tabs,
  Tag,
  DatePicker,
  Statistic,
  Drawer,
  Popconfirm,
  Row,
  Col,
  Card
} from 'antd'
import { PageActionBar } from '../../components/CompactHeader'
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  UserOutlined,
  WalletOutlined,
  HistoryOutlined,
  ExpandOutlined,
  ShrinkOutlined,
  EyeOutlined
} from '@ant-design/icons'
import {
  getUserList,
  getUserDetail,
  updateUser,
  getUserAccount,
  getPointsStatistics,
  getUserPointsRecordsDetailed,
  adjustUserPoints
} from '../../services/user'
import { getPlans } from '../../services/subscription'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker
const { TabPane } = Tabs

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: undefined,
    role: undefined
  })
  const [userDetailVisible, setUserDetailVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [accountInfo, setAccountInfo] = useState(null)
  const [pointsStatistics, setPointsStatistics] = useState(null)
  const [pointsRecords, setPointsRecords] = useState([])
  const [pointsLoading, setPointsLoading] = useState(false)
  const [pointsPagination, setPointsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })
  const [dateRange, setDateRange] = useState([])
  const [adjustPointsVisible, setAdjustPointsVisible] = useState(false)
  const [plans, setPlans] = useState([])
  const [adjustPointsForm] = Form.useForm()
  const [editUserVisible, setEditUserVisible] = useState(false)
  const [editUserForm] = Form.useForm()
  const [editingUser, setEditingUser] = useState(null)
  const [drawerWidth, setDrawerWidth] = useState(1000)
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false)

  // 获取用户列表
  const fetchUsers = async (params = {}) => {
    setLoading(true)
    try {
      const { pageNum = 1, pageSize = 20, ...rest } = params
      const response = await getUserList({
        pageNum,
        pageSize,
        ...rest
      })

      console.log('Response:', response)

      if (response.data) {
        setUsers(response.data || [])
        setPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total
        })
      }
    } catch (error) {
      message.error('获取用户列表失败')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取用户详情
  const fetchUserDetail = async (userId) => {
    try {
      // 并行获取用户详情、账户信息和套餐列表
      const [response, accountResponse, plansResponse] = await Promise.all([
        getUserDetail(userId),
        getUserAccount(userId),
        getPlans()
      ])

      if (response.data) {
        setUserDetail(response.data)
      }

      if (accountResponse.data) {
        setAccountInfo(accountResponse.data)
      }

      if (plansResponse.data) {
        setPlans(plansResponse.data || [])
      }

      // 获取积分统计
      const statsResponse = await getPointsStatistics(userId)
      if (statsResponse.data) {
        setPointsStatistics(statsResponse.data)
      }

      // 获取积分记录
      fetchPointsRecords(userId)
    } catch (error) {
      message.error('获取用户详情失败')
      console.error('Error fetching user detail:', error)
    }
  }

  // 获取积分记录
  const fetchPointsRecords = async (userId, params = {}) => {
    setPointsLoading(true)
    try {
      const { pageNum = 1, pageSize = 10, ...rest } = params
      const queryParams = {
        pageNum,
        pageSize,
        ...rest
      }

      // 添加时间范围筛选
      if (dateRange && dateRange.length === 2) {
        queryParams.startDate = dayjs(dateRange[0]).format('YYYY-MM-DD')
        queryParams.endDate = dayjs(dateRange[1]).format('YYYY-MM-DD')
      }

      const response = await getUserPointsRecordsDetailed(userId, queryParams)
      if (response.data) {
        setPointsRecords(response.data || [])
        setPointsPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total
        })
      }
    } catch (error) {
      message.error('获取积分记录失败')
      console.error('Error fetching points records:', error)
    } finally {
      setPointsLoading(false)
    }
  }

  // 处理表格变化
  const handleTableChange = (pagination, filters, sorter) => {
    fetchUsers({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      ...searchParams
    })
  }

  // 处理搜索
  const handleSearch = () => {
    fetchUsers({
      pageNum: 1,
      pageSize: pagination.pageSize,
      ...searchParams
    })
  }

  // 重置搜索
  const handleReset = () => {
    setSearchParams({
      keyword: '',
      status: undefined,
      role: undefined
    })
    fetchUsers({
      pageNum: 1,
      pageSize: pagination.pageSize
    })
  }

  // 查看用户详情
  const handleViewDetail = (user) => {
    setSelectedUser(user)
    setUserDetailVisible(true)
    fetchUserDetail(user.userId)
  }

  // 关闭详情抽屉
  const handleCloseDetail = () => {
    setUserDetailVisible(false)
    setSelectedUser(null)
    setUserDetail(null)
    setAccountInfo(null)
    setPointsStatistics(null)
    setPointsRecords([])
    setDateRange([])
    setDrawerWidth(800)
    setIsDrawerExpanded(false)
  }

  // 切换 Drawer 宽度
  const toggleDrawerWidth = () => {
    if (isDrawerExpanded) {
      setDrawerWidth(800)
    } else {
      setDrawerWidth(1200)
    }
    setIsDrawerExpanded(!isDrawerExpanded)
  }

  // 处理积分记录分页变化
  const handlePointsTableChange = (pagination) => {
    fetchPointsRecords(selectedUser.userId, {
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    })
  }

  // 处理时间范围变化
  const handleDateRangeChange = (dates) => {
    setDateRange(dates)
    if (selectedUser) {
      fetchPointsRecords(selectedUser.userId, {
        pageNum: 1,
        pageSize: pointsPagination.pageSize
      })
    }
  }

  // 打开调整积分弹窗
  const handleOpenAdjustPoints = () => {
    adjustPointsForm.resetFields()
    setAdjustPointsVisible(true)
  }

  // 提交调整积分
  const handleSubmitAdjustPoints = async () => {
    try {
      const values = await adjustPointsForm.validateFields()
      await adjustUserPoints(selectedUser.userId, values)
      message.success('积分调整成功')
      setAdjustPointsVisible(false)

      const accountResponse = await getUserAccount(selectedUser.userId)
      if (accountResponse.data) {
        setAccountInfo(accountResponse.data)
      }

      const statsResponse = await getPointsStatistics(selectedUser.userId)
      if (statsResponse.data) {
        setPointsStatistics(statsResponse.data)
      }

      fetchPointsRecords(selectedUser.userId, {
        pageNum: 1,
        pageSize: pointsPagination.pageSize
      })
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写完整信息')
      } else {
        message.error('积分调整失败')
        console.error('Error adjusting points:', error)
      }
    }
  }

  const handleEditUser = (record) => {
    setEditingUser(record)
    editUserForm.setFieldsValue({
      username: record.username,
      nickname: record.nickname || '',
      email: record.email || '',
      phone: record.phone || '',
      status: record.status
    })
    setEditUserVisible(true)
  }

  const handleSubmitEditUser = async () => {
    try {
      const values = await editUserForm.validateFields()
      await updateUser({
        userId: editingUser.userId,
        ...values
      })
      message.success('用户更新成功')
      setEditUserVisible(false)
      fetchUsers()
    } catch (error) {
      if (error.errorFields) {
        return
      }
      message.error('用户更新失败')
      console.error('Error updating user:', error)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 200,
      ellipsis: true
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <a
          onClick={() => handleViewDetail(record)}
          style={{ color: '#00d4ff', cursor: 'pointer' }}
        >
          {text}
        </a>
      )
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (text) => text || '-'
    },
    {
      title: '机构',
      dataIndex: 'organization',
      key: 'organization',
      render: (text, record) => record.profile?.organization || '-'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '活跃' : '禁用'}
        </Tag>
      )
    },
    {
      title: '注册时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginTime',
      key: 'lastLoginTime',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            title="查看"
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
            title="编辑"
          />
        </Space>
      )
    }
  ]

  // 积分记录列定义
  const pointsColumns = [
    {
      title: '记录ID',
      dataIndex: 'recordId',
      key: 'recordId',
      width: 180,
      ellipsis: true
    },
    {
      title: '积分变动',
      dataIndex: 'points',
      key: 'points',
      width: 90,
      render: (points) => (
        <span style={{ color: points > 0 ? '#52c41a' : '#ff4d4f' }}>
          {points > 0 ? `+${points}` : points}
        </span>
      )
    },
    {
      title: '类型',
      dataIndex: 'typeName',
      key: 'typeName',
      width: 100,
      ellipsis: true
    },
    {
      title: '变动后余额',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 100
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 120,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    }
  ]

  // 初始化加载
  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索用户名/昵称/邮箱"
            prefix={<SearchOutlined />}
            value={searchParams.keyword}
            onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
            style={{ width: 200 }}
            allowClear
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            value={searchParams.status}
            onChange={(value) => setSearchParams({ ...searchParams, status: value })}
            allowClear
          >
            <Option value="ACTIVE">活跃</Option>
            <Option value="INACTIVE">禁用</Option>
          </Select>
          <Select
            placeholder="角色"
            style={{ width: 120 }}
            value={searchParams.role}
            onChange={(value) => setSearchParams({ ...searchParams, role: value })}
            allowClear
          >
            <Option value="ADMIN">管理员</Option>
            <Option value="USER">普通用户</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="userId"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            size: 'small'
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </div>

      {/* 用户详情抽屉 */}
      <Drawer
        title="用户详情"
        width={drawerWidth}
        open={userDetailVisible}
        onClose={handleCloseDetail}
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
        {userDetail && accountInfo && (
          <Tabs defaultActiveKey="1">
            <TabPane tab="账户信息" key="1" icon={<WalletOutlined />}>
              {/* 用户基本信息卡片 */}
              <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>用户名：</span>
                      <span style={{ fontWeight: 500 }}>{userDetail.user?.username}</span>
                      <Tag color={userDetail.status === 'ACTIVE' ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                        {userDetail.status === 'ACTIVE' ? '活跃' : '禁用'}
                      </Tag>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>邮箱：</span>
                      <span>{userDetail.user?.email || '-'}</span>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>机构：</span>
                      <span>{userDetail.profile?.organization || '-'}</span>
                    </div>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={8}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>注册日期：</span>
                      <span>{dayjs(userDetail.registerTime).format('YYYY-MM-DD')}</span>
                    </div>
                  </Col>
                  <Col span={16}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ color: '#666' }}>最后登录：</span>
                      <span>{userDetail.lastLoginTime ? dayjs(userDetail.lastLoginTime).format('YYYY-MM-DD HH:mm') : '-'}</span>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* 三类账户信息卡片 */}
              <Row gutter={16}>
                {/* 套餐订阅卡片 */}
                <Col span={8} style={{ display: 'flex' }}>
                  <Card size="small" title="套餐订阅" extra={<Tag color="purple">Subscription</Tag>} style={{ width: '100%', height: 250 }}>
                    <Statistic
                      title="状态"
                      value={
                        !accountInfo.subscriptionEndTime
                          ? '未订阅'
                          : dayjs().isBefore(dayjs(accountInfo.subscriptionEndTime))
                            ? '有效'
                            : '已过期'
                      }
                      valueStyle={{
                        color: !accountInfo.subscriptionEndTime
                          ? '#999'
                          : dayjs().isBefore(dayjs(accountInfo.subscriptionEndTime))
                            ? '#52c41a'
                            : '#ff4d4f',
                        fontSize: 20
                      }}
                    />
                    <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                      {accountInfo.currentPlanId ? (
                        plans.find(p => p.planId === accountInfo.currentPlanId)?.planName || '未知套餐'
                      ) : '未订阅'}
                    </div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {accountInfo.subscriptionEndTime
                        ? `到期: ${dayjs(accountInfo.subscriptionEndTime).format('YYYY-MM-DD')}`
                        : ''}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>套餐流量额度（按月）</div>
                      <div style={{ fontSize: 14, color: '#722ed1' }}>
                        {accountInfo.subscribeTokenQuota > 0
                          ? `${accountInfo.subscribeTokenQuota.toLocaleString()} Tokens`
                          : '无套餐额度'}
                      </div>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>套餐流量余额（按月）</div>
                      <div style={{ fontSize: 14, color: '#1890ff' }}>
                        {accountInfo.subscribeTokenBalance > 0
                          ? `${accountInfo.subscribeTokenBalance.toLocaleString()} Tokens`
                          : '0'}
                      </div>
                    </div>
                  </Card>
                </Col>

                {/* 积分卡片 */}
                <Col span={8} style={{ display: 'flex' }}>
                  <Card size="small" title="积分" extra={<Tag color="orange">Points</Tag>} style={{ width: '100%', height: 250 }}>
                    <Statistic
                      title="可用余额"
                      value={accountInfo.pointsBalance}
                      valueStyle={{ color: '#fa8c16', fontSize: 24 }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Button type="primary" size="small" onClick={handleOpenAdjustPoints}>
                        调整积分
                      </Button>
                    </div>
                  </Card>
                </Col>

                {/* 大模型流量卡片 */}
                <Col span={8} style={{ display: 'flex' }}>
                  <Card size="small" title="大模型流量" extra={<Tag color="cyan">Token</Tag>} style={{ width: '100%', height: 250 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>充值流量余额</div>
                      <div style={{ fontSize: 18, color: '#52c41a' }}>
                        {accountInfo.tokenBalance > 0
                          ? `${accountInfo.tokenBalance.toLocaleString()} Tokens`
                          : '0'}
                      </div>
                    </div>
                  </Card>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="积分明细" key="2" icon={<HistoryOutlined />}>
              {pointsStatistics && (
                <div style={{ marginBottom: 16, display: 'flex', gap: 32 }}>
                  <div>
                    <span style={{ color: '#999', fontSize: 12 }}>当前余额 </span>
                    <span style={{ color: '#1890ff', fontSize: 18 }}>{pointsStatistics.balance}</span>
                  </div>
                  <div>
                    <span style={{ color: '#999', fontSize: 12 }}>累计获得 </span>
                    <span style={{ color: '#52c41a', fontSize: 18 }}>{pointsStatistics.totalEarned}</span>
                  </div>
                  <div>
                    <span style={{ color: '#999', fontSize: 12 }}>累计使用 </span>
                    <span style={{ color: '#ff4d4f', fontSize: 18 }}>{pointsStatistics.totalUsed}</span>
                  </div>
                  <div>
                    <span style={{ color: '#999', fontSize: 12 }}>本年累计使用 </span>
                    <span style={{ color: '#fa8c16', fontSize: 18 }}>{pointsStatistics.annualUsed}</span>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <Space>
                  <span>时间范围：</span>
                  <RangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    format="YYYY-MM-DD"
                  />
                  <Button
                    onClick={() => {
                      setDateRange([])
                      if (selectedUser) {
                        fetchPointsRecords(selectedUser.userId, {
                          pageNum: 1,
                          pageSize: pointsPagination.pageSize
                        })
                      }
                    }}
                  >
                    清除筛选
                  </Button>
                </Space>
              </div>

              <Table
                columns={pointsColumns}
                dataSource={pointsRecords}
                rowKey="recordId"
                loading={pointsLoading}
                pagination={{
                  ...pointsPagination,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`
                }}
                onChange={handlePointsTableChange}
                scroll={{ x: 800 }}
              />
            </TabPane>
          </Tabs>
        )}
      </Drawer>

      {/* 调整积分弹窗 */}
      <Modal
        title="调整积分"
        open={adjustPointsVisible}
        onOk={handleSubmitAdjustPoints}
        onCancel={() => setAdjustPointsVisible(false)}
        width={500}
      >
        <Form form={adjustPointsForm} layout="vertical">
          <Form.Item
            name="points"
            label="积分变动"
            rules={[
              { required: true, message: '请输入积分变动值' }
            ]}
            extra="正数表示增加，负数表示扣减"
          >
            <InputNumber placeholder="请输入积分变动值" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea
              rows={3}
              placeholder="请输入备注信息（可选）"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑用户"
        open={editUserVisible}
        onOk={handleSubmitEditUser}
        onCancel={() => setEditUserVisible(false)}
        width={600}
      >
        <Form form={editUserForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 50, message: '用户名最多50个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[
              { max: 50, message: '昵称最多50个字符' }
            ]}
          >
            <Input placeholder="请输入昵称（可选）" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱（可选）" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input placeholder="请输入手机号（可选）" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[
              { required: true, message: '请选择状态' }
            ]}
          >
            <Select>
              <Option value="ACTIVE">活跃</Option>
              <Option value="INACTIVE">禁用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
