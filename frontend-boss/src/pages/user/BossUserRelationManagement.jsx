import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Select,
  Space,
  Modal,
  Form,
  message,
  Tag,
  Input,
} from 'antd'
import { PageActionBar } from '../../components/CompactHeader'
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  getBossUserRelationList,
  createBossUserRelation,
  deleteBossUserRelation,
  getUserList,
} from '../../services/user'
import dayjs from 'dayjs'

// Boss用户类型枚举
const BOSS_USER_TYPE = {
  ADMIN: { label: '管理员', color: 'blue' },
  EDIT: { label: '编辑', color: 'green' },
  READ: { label: '只读', color: 'orange' },
}

const BossUserRelationManagement = () => {
  const [relations, setRelations] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [userType, setUserType] = useState('ADMIN')
  const [foundUser, setFoundUser] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searched, setSearched] = useState(false)  // 是否已搜索
  const [userNotFound, setUserNotFound] = useState(false)  // 用户不存在

  // 获取Boss用户关联列表
  const fetchRelations = async () => {
    setLoading(true)
    try {
      const response = await getBossUserRelationList()
      if (response.data) {
        setRelations(response.data || [])
      }
    } catch (error) {
      message.error('获取Boss用户关联列表失败')
      console.error('Error fetching relations:', error)
    } finally {
      setLoading(false)
    }
  }

  // 查询用户
  const handleSearchUser = async () => {
    const identifier = form.getFieldValue('identifier')
    if (!identifier || identifier.trim() === '') {
      message.warning('请输入用户ID或邮箱')
      return
    }

    setSearchLoading(true)
    setFoundUser(null)
    setUserNotFound(false)
    setSearched(true)
    try {
      // 搜索用户
      const response = await getUserList({
        keyword: identifier.trim(),
        pageNum: 1,
        pageSize: 20,
      })

      // request.js 已经将 res.value.list 提取为 response.data
      const userList = response.data || []

      if (userList.length === 0) {
        setUserNotFound(true)
        return
      }

      // 精确匹配 userId 或 email
      const user = userList.find(
        (u) => u.userId === identifier.trim() || u.email === identifier.trim()
      )

      if (!user) {
        setUserNotFound(true)
        return
      }

      // 检查是否已是Boss用户
      const exists = relations.some((r) => r.userId === user.userId)
      if (exists) {
        message.warning('该用户已是Boss用户')
        setFoundUser(null)
        setUserNotFound(false)
      } else {
        setFoundUser(user)
        setUserNotFound(false)
        message.success('用户已找到')
      }
    } catch (error) {
      message.error('查询用户失败')
      console.error('Error searching user:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // 打开新增弹窗
  const handleOpenAdd = () => {
    setFoundUser(null)
    setUserType('ADMIN')
    setSearched(false)
    setUserNotFound(false)
    form.resetFields()
    setModalVisible(true)
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!foundUser) {
      message.warning('请先查询并确认用户')
      return
    }

    try {
      await createBossUserRelation({
        userId: foundUser.userId,
        userType: userType,
      })
      message.success('添加成功')
      setModalVisible(false)
      fetchRelations()
    } catch (error) {
      const errorMsg = error?.response?.data?.message || '添加失败'
      message.error(errorMsg)
      console.error('Error submitting:', error)
    }
  }

  // 删除关联
  const handleDelete = async (userId) => {
    try {
      await deleteBossUserRelation(userId)
      message.success('删除成功')
      fetchRelations()
    } catch (error) {
      const errorMsg = error?.response?.data?.message || '删除失败'
      message.error(errorMsg)
      console.error('Error deleting:', error)
    }
  }

  // 表格列定义
  const columns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 250,
      ellipsis: true,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (text) => text || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      key: 'userType',
      width: 120,
      render: (type) => {
        const config = BOSS_USER_TYPE[type] || { label: type, color: 'default' }
        return <Tag color={config.color}>{config.label}</Tag>
      },
    },
    {
      title: '创建人',
      dataIndex: 'createBy',
      key: 'createBy',
      width: 150,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (time) => (time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record.userId)}
            title="删除"
          />
        </Space>
      ),
    },
  ]

  // 初始化
  useEffect(() => {
    fetchRelations()
  }, [])

  return (
    <div>
      <PageActionBar>
        <Space size="small">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd} size="small">
            添加Boss用户
          </Button>
        </Space>
        <Space size="small">
          <Button icon={<ReloadOutlined />} onClick={fetchRelations} size="small">
            刷新
          </Button>
        </Space>
      </PageActionBar>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={relations}
          rowKey="userId"
          loading={loading}
          pagination={{
            showTotal: (total) => `共 ${total} 条记录`,
            size: 'small',
          }}
          scroll={{ x: 800 }}
          size="small"
        />
      </div>

      {/* 新增弹窗 */}
      <Modal
        title="添加Boss用户"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
        okText="确认添加"
        okButtonProps={{ disabled: !foundUser }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="用户ID或邮箱" name="identifier">
            <Input
              placeholder="请输入用户ID或邮箱"
              addonAfter={
                <Button
                  type="link"
                  icon={<SearchOutlined />}
                  loading={searchLoading}
                  onClick={handleSearchUser}
                  style={{ padding: 0, height: 'auto' }}
                >
                  查询
                </Button>
              }
            />
          </Form.Item>

          {foundUser ? (
            <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 4, border: '1px solid #91d5ff' }}>
              <p style={{ marginBottom: 8 }}>
                <strong>用户信息：</strong>
              </p>
              <p style={{ marginBottom: 4 }}>用户ID：{foundUser.userId}</p>
              <p style={{ marginBottom: 4 }}>用户名：{foundUser.username}</p>
              <p style={{ marginBottom: 4 }}>邮箱：{foundUser.email || '-'}</p>
              <p style={{ marginBottom: 0 }}>昵称：{foundUser.nickname || '-'}</p>
            </div>
          ) : searched && userNotFound ? (
            <div style={{ marginBottom: 16, padding: 12, background: '#fff1f0', borderRadius: 4, border: '1px solid #ffccc7', textAlign: 'center', color: '#ff4d4f' }}>
              用户不存在
            </div>
          ) : null}

          <Form.Item label="用户类型">
            <Select value={userType} onChange={setUserType}>
              <Select.Option value="ADMIN">管理员</Select.Option>
              <Select.Option value="EDIT">编辑</Select.Option>
              <Select.Option value="READ">只读</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BossUserRelationManagement
