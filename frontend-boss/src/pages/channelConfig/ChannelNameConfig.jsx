import React, { useState } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Modal,
  Form,
  InputNumber,
  Input,
  Drawer,
  Descriptions,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EditOutlined,
  CopyOutlined,
} from '@ant-design/icons'
import { getSysctl, saveSysctl } from '../../services/systctl'

const { Text } = Typography

const SYSCTL_KEY = 'ORDER_CHANNEL_CONFIG'

const ChannelNameConfig = () => {
  const [channelConfigs, setChannelConfigs] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  // 获取渠道配置列表
  const fetchChannelConfigs = async () => {
    setLoading(true)
    try {
      const res = await getSysctl(SYSCTL_KEY)
      const value = res.data
      if (value) {
        const list = JSON.parse(value)
        setChannelConfigs(list.map((item, index) => ({ ...item, key: index })))
      } else {
        setChannelConfigs([])
      }
    } catch (error) {
      message.error('获取渠道配置失败')
    } finally {
      setLoading(false)
    }
  }

  // 初始化
  React.useEffect(() => {
    fetchChannelConfigs()
  }, [])

  // 单个保存渠道配置（立即保存）
  const saveChannelConfig = async (configList) => {
    setSaving(true)
    try {
      const data = configList.map(({ key, ...rest }) => rest)
      await saveSysctl(SYSCTL_KEY, JSON.stringify(data))
      message.success('保存成功')
      fetchChannelConfigs()
    } catch (error) {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 表单字段到 month 的映射
  const monthMap = { price3: 3, price6: 6, price12: 12, price24: 24, price36: 36 }
  const descMap = { price3: '3个月', price6: '6个月', price12: '1年', price24: '2年', price36: '3年' }

  // 打开编辑弹窗
  const handleEdit = (record) => {
    setEditingRecord(record)
    // 从数组格式转换回表单字段
    const formValues = { name: record.name }
    if (Array.isArray(record.price)) {
      record.price.forEach(item => {
        const field = Object.keys(monthMap).find(k => monthMap[k] === item.month)
        if (field) formValues[field] = item.price
      })
    }
    form.setFieldsValue(formValues)
    setModalVisible(true)
  }

  // 查看详情
  const handleViewDetail = (record) => {
    setSelectedRecord(record)
    setDetailVisible(true)
  }

  // 删除渠道配置（立即保存）
  const handleDelete = async (key) => {
    const newChannelConfigs = channelConfigs.filter(item => item.key !== key)
    setChannelConfigs(newChannelConfigs)
    await saveChannelConfig(newChannelConfigs)
  }

  // 弹窗确认（单个保存）
  const handleModalOk = () => {
    form.validateFields().then(async values => {
      // 检查名称是否已存在
      const isNameExists = channelConfigs.some(item =>
        item.name === values.name && (!editingRecord || item.key !== editingRecord.key)
      )
      if (isNameExists) {
        message.error('渠道名称已存在')
        return
      }

      const price = []
      Object.entries(monthMap).forEach(([field, month]) => {
        if (values[field] != null) {
          price.push({ month, price: values[field], desc: descMap[field] })
        }
      })

      let newChannelConfigs
      if (editingRecord) {
        // 编辑模式
        newChannelConfigs = channelConfigs.map(item =>
          item.key === editingRecord.key
            ? { ...item, name: values.name, price }
            : item
        )
      } else {
        // 新增模式
        newChannelConfigs = [
          ...channelConfigs,
          { key: Date.now(), name: values.name, price }
        ]
      }

      setModalVisible(false)
      form.resetFields()

      // 立即保存到后端
      await saveChannelConfig(newChannelConfigs)
    })
  }

  // 价格渲染 - Tag 形式显示
  const renderPriceCompact = (price) => {
    if (!price || !Array.isArray(price)) return '-'
    return (
      <Space size="small" wrap>
        {price.map((item, idx) => (
          <Tag key={idx} color="blue">{item.desc}: ¥{item.price}</Tag>
        ))}
      </Space>
    )
  }

  // 价格渲染 - 详情抽屉用
  const renderPriceDetail = (price) => {
    if (!price || !Array.isArray(price)) return '-'
    return (
      <Descriptions column={2} size="small">
        {price.map((item, idx) => (
          <Descriptions.Item key={idx} label={item.desc}>{item.price}</Descriptions.Item>
        ))}
      </Descriptions>
    )
  }

  // 复制渠道配置 - 打开新增弹窗
  const handleCopy = (record) => {
    setEditingRecord(null)
    // 从数组格式转换回表单字段
    const formValues = { name: record.name + '_copy' }
    if (Array.isArray(record.price)) {
      record.price.forEach(item => {
        const field = Object.keys(monthMap).find(k => monthMap[k] === item.month)
        if (field) formValues[field] = item.price
      })
    }
    form.setFieldsValue(formValues)
    setModalVisible(true)
  }

  const columns = [
    {
      title: '序号',
      dataIndex: 'key',
      key: 'key',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '渠道名称',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (text, record) => (
        <a onClick={() => handleEdit(record)}>{text}</a>
      ),
    },
    {
      title: '供货价',
      key: 'price',
      render: (_, record) => renderPriceCompact(record.price),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="复制">
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确认删除该渠道配置？"
            onConfirm={() => handleDelete(record.key)}
            okText="确认"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="channel-name-config">
      {/* 筛选操作区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Text strong style={{ fontSize: 16 }}>渠道配置列表</Text>
          <div style={{ flex: 1 }} />
          <Button icon={<ReloadOutlined />} onClick={fetchChannelConfigs} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增渠道
          </Button>
        </Space>
      </Card>

      {/* 表格区域 */}
      <Table
        columns={columns}
        dataSource={channelConfigs}
        loading={loading}
        rowKey="key"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个渠道配置`
        }}
        size="middle"
        scroll={{ x: 800 }}
      />

      {/* 详情抽屉 */}
      <Drawer
        title="渠道详情"
        placement="right"
        width={520}
        onClose={() => setDetailVisible(false)}
        open={detailVisible}
      >
        {selectedRecord && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="渠道名称">{selectedRecord.name}</Descriptions.Item>
            <Descriptions.Item label="供货价设置" span={2}>
              {renderPriceDetail(selectedRecord.price)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRecord ? '编辑渠道' : '新增渠道'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        okText="确认"
        cancelText="取消"
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="渠道名称"
            rules={[{ required: true, message: '请输入渠道名称' }]}
          >
            <Input placeholder="请输入渠道名称" style={{ width: '100%' }} />
          </Form.Item>

          <Typography.Title level={5} style={{ marginBottom: 16, marginTop: 8 }}>
            供货价设置
          </Typography.Title>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            <Form.Item name="price3" label="3个月" rules={[{ required: true, message: '请输入3个月供货价' }]} style={{ marginBottom: 0 }}>
              <InputNumber min={0} placeholder="请输入" style={{ width: '100%' }} addonAfter="元" />
            </Form.Item>
            <Form.Item name="price6" label="6个月" rules={[{ required: true, message: '请输入6个月供货价' }]} style={{ marginBottom: 0 }}>
              <InputNumber min={0} placeholder="请输入" style={{ width: '100%' }} addonAfter="元" />
            </Form.Item>
            <Form.Item name="price12" label="1年" rules={[{ required: true, message: '请输入1年供货价' }]} style={{ marginBottom: 0 }}>
              <InputNumber min={0} placeholder="请输入" style={{ width: '100%' }} addonAfter="元" />
            </Form.Item>
            <Form.Item name="price24" label="2年" rules={[{ required: true, message: '请输入2年供货价' }]} style={{ marginBottom: 0 }}>
              <InputNumber min={0} placeholder="请输入" style={{ width: '100%' }} addonAfter="元" />
            </Form.Item>
            <Form.Item name="price36" label="3年" rules={[{ required: true, message: '请输入3年供货价' }]} style={{ marginBottom: 0 }}>
              <InputNumber min={0} placeholder="请输入" style={{ width: '100%' }} addonAfter="元" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default ChannelNameConfig
