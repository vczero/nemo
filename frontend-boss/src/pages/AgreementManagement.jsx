import React, { useState, useEffect } from 'react'
import dayjs from 'dayjs'
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
  Tabs,
  Segmented,
  Typography,
  Card,
  DatePicker,
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  CheckOutlined,
  DeleteOutlined,
  CopyOutlined,
  LinkOutlined,
  FileTextOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import UserSelect from '../components/UserSelect'
import {
  getAgreementPage,
  getAgreementDetail,
  createAgreement,
  activateAgreement,
  deleteAgreement,
  getUserAgreementPage,
  AgreementType,
  AgreementTypeMap,
} from '../services/agreement'

const { TextArea } = Input
const { Text } = Typography
const { RangePicker } = DatePicker

/**
 * 构建协议HTML内容
 * 将纯文本协议内容包装成美观的HTML页面
 */
const buildAgreementHtml = (content, title = '', version = '', effectiveDate = '') => {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || '用户协议'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
      line-height: 1.8;
      color: #333;
      padding: 20px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      text-align: center;
      margin-bottom: 20px;
    }
    .meta {
      text-align: center;
      color: #666;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .meta span {
      margin: 0 8px;
    }
    h2 {
      font-size: 18px;
      font-weight: 500;
      color: #262626;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    p {
      margin-bottom: 12px;
    }
    @media (max-width: 768px) {
      h1 {
        font-size: 20px;
      }
      h2 {
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <h1>${title || '用户协议'}</h1>
  <div class="meta">
    ${version ? `<span>版本号：${version}</span>` : ''}
    ${effectiveDate ? `<span>生效日期：${effectiveDate}</span>` : ''}
  </div>
  <div class="content">
${content}
  </div>
</body>
</html>`
}

/**
 * 从HTML中提取纯文本内容
 * 用于编辑时从已存储的HTML中提取原始内容
 */
const extractContentFromHtml = html => {
  // 创建临时DOM元素解析HTML
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const contentDiv = doc.querySelector('.content')
  if (contentDiv) {
    return contentDiv.innerHTML
  }
  // 如果没有找到.content，返回body内容
  return doc.body.innerHTML
}

// 协议类型的Tab配置
const AGREEMENT_TYPE_TABS = [
  { key: AgreementType.USER_AGREEMENT, label: '用户协议' },
  { key: AgreementType.PRIVACY_POLICY, label: '隐私政策' },
  { key: AgreementType.SERVICE_AGREEMENT, label: '产品服务协议' },
]

const AgreementManagement = () => {
  const [activeTab, setActiveTab] = useState('agreement')
  const [agreementType, setAgreementType] = useState(AgreementType.USER_AGREEMENT)

  const [loading, setLoading] = useState(false)
  const [agreements, setAgreements] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [createForm] = Form.useForm()
  const [currentAgreement, setCurrentAgreement] = useState(null)

  // 用户授权记录
  const [userAgreements, setUserAgreements] = useState([])
  const [userTotal, setUserTotal] = useState(0)
  const [userPage, setUserPage] = useState(1)
  const [userPageSize, setUserPageSize] = useState(20)
  const [userFilters, setUserFilters] = useState({
    userId: '',
    startTime: null,
    endTime: null,
  })
  const [selectedUser, setSelectedUser] = useState(null)

  const fetchAgreements = async () => {
    setLoading(true)
    try {
      const res = await getAgreementPage({
        pageNum: page,
        pageSize,
        type: agreementType,
      })
      setAgreements(res.data || [])
      setTotal(res.total || 0)
    } catch (error) {
      message.error(error.message || '获取协议列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserAgreements = async () => {
    setLoading(true)
    try {
      const params = {
        pageNum: userPage,
        pageSize: userPageSize,
        ...userFilters,
      }
      // 移除空值
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key]
        }
      })
      const res = await getUserAgreementPage(params)
      setUserAgreements(res.data || [])
      setUserTotal(res.total || 0)
    } catch (error) {
      message.error(error.message || '获取授权记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'agreement') {
      fetchAgreements()
    } else {
      fetchUserAgreements()
    }
  }, [activeTab, page, pageSize, userPage, userPageSize, agreementType, userFilters])

  const handleAgreementTypeChange = key => {
    setAgreementType(key)
    setPage(1) // 切换类型时重置页码
  }

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      // 将纯文本内容包装成HTML
      const formatDate = date => {
        const d = date ? new Date(date) : new Date()
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      const effectiveDateStr = formatDate(values.effectiveDate)
      const htmlContent = buildAgreementHtml(values.content, values.title, values.version, effectiveDateStr)
      await createAgreement({
        ...values,
        content: htmlContent,
      })
      message.success('创建成功')
      setCreateModalVisible(false)
      createForm.resetFields()
      fetchAgreements()
    } catch (error) {
      message.error(error.message || '创建失败')
    }
  }

  const handleActivate = async agreementId => {
    try {
      await activateAgreement({ agreementId })
      message.success('激活成功')
      fetchAgreements()
    } catch (error) {
      message.error(error.message || '激活失败')
    }
  }

  const handleDelete = async agreementId => {
    try {
      await deleteAgreement(agreementId)
      message.success('删除成功')
      fetchAgreements()
    } catch (error) {
      message.error(error.message || '删除失败')
    }
  }

  const handleViewDetail = async record => {
    try {
      const res = await getAgreementDetail(record.agreementId)
      setCurrentAgreement(res.data || record)
      setDetailModalVisible(true)
    } catch (error) {
      message.error(error.message || '获取详情失败')
    }
  }

  const handlePreviewUrl = () => {
    if (currentAgreement?.agreementId) {
      window.open(`/boss/api/agreements/${currentAgreement.agreementId}/preview`, '_blank')
    }
  }

  const handleCopyCreate = async record => {
    try {
      const res = await getAgreementDetail(record.agreementId)
      const agreement = res.data || record
      // 预填充表单，版本号自动递增提示
      const newVersion = agreement.version.replace(/\d+$/, match => {
        const num = parseInt(match, 10)
        return isNaN(num) ? match : (num + 1).toString()
      })
      // 从已存储的HTML中提取纯文本内容
      const plainContent = extractContentFromHtml(agreement.content)
      createForm.setFieldsValue({
        type: agreement.type,
        title: agreement.title,
        content: plainContent,
        version: newVersion,
        isActive: 0,
      })
      setCreateModalVisible(true)
      message.info('已基于选中协议预填充，请修改版本号后创建')
    } catch (error) {
      message.error(error.message || '获取协议详情失败')
    }
  }

  const openCreateModal = () => {
    createForm.resetFields()
    createForm.setFieldsValue({
      type: agreementType, // 默认选中当前tab的类型
    })
    setCreateModalVisible(true)
  }

  // 用户授权记录筛选变化
  const handleUserFilterChange = (key, value) => {
    setUserFilters(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  // 用户选择变化
  const handleUserSelectChange = user => {
    setSelectedUser(user)
    setUserFilters(prev => ({
      ...prev,
      userId: user?.userId || '',
    }))
  }

  // 重置用户授权记录筛选
  const handleResetUserFilters = () => {
    setUserFilters({
      userId: '',
      startTime: null,
      endTime: null,
    })
    setSelectedUser(null)
  }

  // 搜索用户授权记录
  const handleUserSearch = () => {
    setUserPage(1)
    fetchUserAgreements()
  }

  // 刷新用户授权记录
  const handleRefreshUserAgreements = () => {
    fetchUserAgreements()
  }

  const agreementColumns = [
    { title: 'ID', dataIndex: 'agreementId', width: 200, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'type',
      width: 140,
      render: type => (
        <Tag
          color={{
            USER_AGREEMENT: 'blue',
            PRIVACY_POLICY: 'green',
            SERVICE_AGREEMENT: 'orange',
          }[type]}
        >
          {AgreementTypeMap[type] || type}
        </Tag>
      ),
    },
    { title: '版本号', dataIndex: 'version', width: 120 },
    { title: '标题', dataIndex: 'title', width: 200, ellipsis: true },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 100,
      render: isActive => (
        <Tag
          color={isActive === 1 ? '#52C41A' : 'default'}
          style={{
            borderRadius: 12,
            padding: '2px 10px',
            fontSize: 12,
          }}
        >
          {isActive === 1 ? '已激活' : '未激活'}
        </Tag>
      ),
    },
    {
      title: '生效时间',
      dataIndex: 'effectiveDate',
      width: 180,
      render: text => (text ? new Date(text).toLocaleString() : '-'),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      render: text => new Date(text).toLocaleString(),
    },
    {
      title: '操作',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.url && (
            <Button size="small" icon={<LinkOutlined />} onClick={() => window.open(`/boss/api/agreements/${record.agreementId}/preview`, '_blank')}>
              预览
            </Button>
          )}
          <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyCreate(record)}>
            复制
          </Button>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.isActive !== 1 && (
            <Popconfirm title="确定激活该协议？" onConfirm={() => handleActivate(record.agreementId)}>
              <Button size="small" type="primary" icon={<CheckOutlined />}>
                激活
              </Button>
            </Popconfirm>
          )}
          {record.isActive !== 1 && (
            <Popconfirm title="确定删除该协议？" onConfirm={() => handleDelete(record.agreementId)}>
              <Button size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const userAgreementColumns = [
    { title: '用户名', dataIndex: 'username', width: 150 },
    { title: '用户邮箱', dataIndex: 'email', width: 200 },
    { title: '协议版本', dataIndex: 'agreementVersion', width: 120 },
    { title: '协议标题', dataIndex: 'agreementTitle', width: 200 },
    { title: 'IP地址', dataIndex: 'ipAddress', width: 150 },
    {
      title: '设备信息',
      dataIndex: 'deviceInfo',
      width: 250,
      ellipsis: true,
      render: text => text || '-',
    },
    {
      title: '授权时间',
      dataIndex: 'createTime',
      width: 180,
      render: text => new Date(text).toLocaleString(),
    },
  ]

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'agreement',
            label: '协议管理',
            children: (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    gap: 16,
                  }}
                >
                  <Segmented
                    value={agreementType}
                    onChange={handleAgreementTypeChange}
                    options={AGREEMENT_TYPE_TABS.map(tab => ({
                      label: tab.label,
                      value: tab.key,
                    }))}
                  />
                  <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    创建{AgreementTypeMap[agreementType]}
                  </Button>
                </div>
                <div className="table-container">
                  <Table
                    rowKey="agreementId"
                    columns={agreementColumns}
                    dataSource={agreements}
                    loading={loading}
                    scroll={{ x: 1600 }}
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
              </>
            ),
          },
          {
            key: 'userAgreement',
            label: '授权记录',
            children: (
              <>
                <Card style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <UserSelect
                      value={selectedUser?.userId}
                      onChange={handleUserSelectChange}
                      placeholder="搜索用户"
                    />

                    <RangePicker
                      value={userFilters.startTime && userFilters.endTime ? [dayjs(userFilters.startTime), dayjs(userFilters.endTime)] : null}
                      onChange={(dates, dateStrings) => {
                        handleUserFilterChange('startTime', dateStrings[0] || null)
                        handleUserFilterChange('endTime', dateStrings[1] || null)
                      }}
                      placeholder={['授权开始日期', '授权结束日期']}
                    />

                    <Button type="primary" icon={<SearchOutlined />} onClick={handleUserSearch}>
                      搜索
                    </Button>

                    <Button icon={<ReloadOutlined />} onClick={handleRefreshUserAgreements}>
                      刷新
                    </Button>

                    <Button onClick={handleResetUserFilters}>
                      重置
                    </Button>
                  </Space>
                </Card>

                <div className="table-container">
                  <Table
                    rowKey="agreementRecordId"
                    columns={userAgreementColumns}
                    dataSource={userAgreements}
                    loading={loading}
                    scroll={{ x: 1200 }}
                    pagination={{
                      current: userPage,
                      pageSize: userPageSize,
                      total: userTotal,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: total => `共 ${total} 条`,
                      size: 'small',
                      onChange: (page, pageSize) => {
                        setUserPage(page)
                        setUserPageSize(pageSize)
                      },
                    }}
                    size="small"
                  />
                </div>
              </>
            ),
          },
        ]}
      />

      {/* 创建协议弹窗 */}
      <Modal
        title="创建协议"
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => {
          setCreateModalVisible(false)
          createForm.resetFields()
        }}
        width={600}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="type"
            label="协议类型"
            rules={[{ required: true, message: '请选择协议类型' }]}
          >
            <Select placeholder="请选择协议类型">
              <Select.Option value={AgreementType.USER_AGREEMENT}>用户协议</Select.Option>
              <Select.Option value={AgreementType.PRIVACY_POLICY}>隐私政策</Select.Option>
              <Select.Option value={AgreementType.SERVICE_AGREEMENT}>产品服务协议</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="version"
            label="版本号"
            rules={[{ required: true, message: '请输入版本号' }]}
          >
            <Input placeholder="如：1.0.0" />
          </Form.Item>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入协议标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="协议内容"
            rules={[{ required: true, message: '请输入协议内容' }]}
          >
            <TextArea rows={10} placeholder="请输入协议内容" />
          </Form.Item>
          <Form.Item name="isActive" label="是否设为激活版本" initialValue={0}>
            <Select>
              <Select.Option value={0}>不激活</Select.Option>
              <Select.Option value={1}>激活</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 协议详情弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span>协议详情</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="preview" type="primary" icon={<LinkOutlined />} onClick={handlePreviewUrl}>
            新窗口预览
          </Button>,
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
        styles={{ body: { padding: 0 } }}
      >
        {currentAgreement && (
          <div style={{ background: '#fafafa' }}>
            {/* 协议头部信息 */}
            <div
              style={{
                padding: '20px 24px',
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Tag
                      color={{
                        USER_AGREEMENT: 'blue',
                        PRIVACY_POLICY: 'green',
                        SERVICE_AGREEMENT: 'orange',
                      }[currentAgreement.type]}
                    >
                      {AgreementTypeMap[currentAgreement.type] || currentAgreement.type}
                    </Tag>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#262626',
                      }}
                    >
                      {currentAgreement.title}
                    </h2>
                    <Tag
                      color={currentAgreement.isActive === 1 ? '#52C41A' : 'default'}
                      style={{
                        borderRadius: 12,
                        padding: '2px 12px',
                        fontSize: 12,
                      }}
                    >
                      {currentAgreement.isActive === 1 ? '已激活' : '未激活'}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    版本号：{currentAgreement.version}
                  </Text>
                </div>
              </div>

              {/* 元信息网格 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16,
                  marginTop: 16,
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 8,
                }}
              >
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    协议ID
                  </Text>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#262626',
                      fontFamily: 'monospace',
                      marginTop: 4,
                      wordBreak: 'break-all',
                    }}
                  >
                    {currentAgreement.agreementId}
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    生效时间
                  </Text>
                  <div style={{ fontSize: 13, color: '#262626', marginTop: 4 }}>
                    {currentAgreement.effectiveDate
                      ? new Date(currentAgreement.effectiveDate).toLocaleString('zh-CN')
                      : '-'}
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    创建时间
                  </Text>
                  <div style={{ fontSize: 13, color: '#262626', marginTop: 4 }}>
                    {new Date(currentAgreement.createTime).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    创建者ID
                  </Text>
                  <div style={{ fontSize: 13, color: '#262626', marginTop: 4 }}>
                    {currentAgreement.createBy || '-'}
                  </div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    更新时间
                  </Text>
                  <div style={{ fontSize: 13, color: '#262626', marginTop: 4 }}>
                    {currentAgreement.updateTime
                      ? new Date(currentAgreement.updateTime).toLocaleString('zh-CN')
                      : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* 协议内容预览 */}
            <div style={{ padding: 24 }}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 8,
                  border: '1px solid #f0f0f0',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    background: '#fafafa',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <Text strong style={{ fontSize: 14 }}>
                    内容预览
                  </Text>
                </div>
                <div
                  style={{
                    maxHeight: 500,
                    overflow: 'auto',
                    padding: 0,
                    background: '#fff',
                  }}
                >
                  <iframe
                    srcDoc={currentAgreement.content}
                    style={{
                      width: '100%',
                      height: 500,
                      border: 'none',
                    }}
                    title="协议预览"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AgreementManagement
