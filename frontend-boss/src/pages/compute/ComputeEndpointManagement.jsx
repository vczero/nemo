import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Descriptions,
  Tag,
  Popconfirm,
  Divider,
  Card,
} from 'antd'
import {
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  getComputeEndpoints,
  createComputeEndpoint,
  updateComputeEndpoint,
  updateComputeEndpointStatus,
  deleteComputeEndpoint,
  getComputeTypes
} from '../../services/compute'

const { Option } = Select

const execCategoryOptions = [
  { value: 'ML_MODEL', label: '传统机器学习模型' },
  { value: 'LLM', label: '大语言模型' }
]

const statusOptions = [
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '禁用' }
]

const ComputeEndpointManagement = () => {
  const [endpoints, setEndpoints] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedEndpoint, setSelectedEndpoint] = useState(null)
  const [editForm] = Form.useForm()
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailEndpoint, setDetailEndpoint] = useState(null)
  const [searchParams, setSearchParams] = useState({
    execCategory: undefined,
    endpointType: undefined,
    status: undefined,
  })
  const [computeTypes, setComputeTypes] = useState([])

  const computeTypeOptions = computeTypes.map(ct => ({
    value: ct.name,
    label: ct.label
  }))

  const getComputeTypesByCategory = (category) => {
    return computeTypes
      .filter(ct => ct.category === category)
      .map(ct => ({ value: ct.name, label: ct.label }))
  }

  const fetchEndpoints = async (params = {}) => {
    setLoading(true)
    try {
      const { pageNum = 1, pageSize = 20, ...rest } = params
      const response = await getComputeEndpoints({
        pageNum,
        pageSize,
        ...searchParams,
        ...rest
      })
      if (response.data) {
        setEndpoints(Array.isArray(response.data) ? response.data : [])
        setPagination({
          current: response.pageNum || 1,
          pageSize: response.pageSize || 20,
          total: response.total || 0
        })
      }
    } catch (error) {
      message.error('获取服务列表失败')
      console.error('Error fetching endpoints:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComputeTypes = async () => {
    try {
      const response = await getComputeTypes()
      if (response.data) {
        setComputeTypes(response.data)
      }
    } catch (error) {
      message.error('获取计算类型失败')
      console.error('Error fetching compute types:', error)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setSelectedEndpoint(null)
    editForm.resetFields()
    editForm.setFieldsValue({
      execCategory: 'ML_MODEL',
      endpointType: 'SEGMENTATION',
      maxRetry: 3,
      timeoutMs: 60000,
      headers: null,
      llmServiceConfig: null,
      mlServiceConfig: null
    })
    setModalVisible(true)
  }

  const handleViewDetail = async (endpoint) => {
    setDetailEndpoint(endpoint)
    setDetailVisible(true)
  }

  const handleEdit = (endpoint) => {
    setModalMode('edit')
    setSelectedEndpoint(endpoint)
    editForm.setFieldsValue({
      endpointName: endpoint.endpointName,
      execCategory: endpoint.execCategory,
      endpointType: endpoint.endpointType,
      endpointUrl: endpoint.endpointUrl,
      headers: endpoint.headers ? (typeof endpoint.headers === 'string' ? endpoint.headers : JSON.stringify(endpoint.headers, null, 2)) : null,
      llmServiceConfig: endpoint.llmServiceConfig ? (typeof endpoint.llmServiceConfig === 'string' ? endpoint.llmServiceConfig : JSON.stringify(endpoint.llmServiceConfig, null, 2)) : null,
      mlServiceConfig: endpoint.mlServiceConfig ? (typeof endpoint.mlServiceConfig === 'string' ? endpoint.mlServiceConfig : JSON.stringify(endpoint.mlServiceConfig, null, 2)) : null,
      maxRetry: endpoint.maxRetry,
      timeoutMs: endpoint.timeoutMs
    })
    setModalVisible(true)
  }

  const handleModalSubmit = async () => {
    try {
      const values = await editForm.validateFields()

      // 解析JSON字符串为对象
      const parseJson = (val) => {
        if (!val || val === 'null' || val === 'undefined') return null
        if (typeof val === 'object') return val
        try {
          return JSON.parse(val)
        } catch {
          return null
        }
      }

      const data = {
        endpointName: values.endpointName,
        execCategory: values.execCategory,
        endpointType: values.endpointType,
        endpointUrl: values.endpointUrl,
        headers: parseJson(values.headers),
        llmServiceConfig: parseJson(values.llmServiceConfig),
        mlServiceConfig: parseJson(values.mlServiceConfig),
        maxRetry: values.maxRetry || 3,
        timeoutMs: values.timeoutMs || 60000
      }

      if (modalMode === 'create') {
        await createComputeEndpoint(data)
        message.success('服务创建成功')
      } else {
        await updateComputeEndpoint(selectedEndpoint.endpointId, data)
        message.success('服务更新成功')
      }
      setModalVisible(false)
      fetchEndpoints({
        pageNum: pagination.current,
        pageSize: pagination.pageSize
      })
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写完整信息')
      } else {
        message.error(`${modalMode === 'create' ? '创建' : '更新'}失败`)
        console.error('Error submitting endpoint:', error)
      }
    }
  }

  const handleDelete = async (endpointId) => {
    try {
      await deleteComputeEndpoint(endpointId)
      message.success('服务删除成功')
      fetchEndpoints({
        pageNum: pagination.current,
        pageSize: pagination.pageSize
      })
    } catch (error) {
      message.error('删除服务失败')
      console.error('Error deleting endpoint:', error)
    }
  }

  const handleTableChange = (pagination) => {
    fetchEndpoints({
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    })
  }

  const handleSearch = () => {
    fetchEndpoints({ pageNum: 1, pageSize: pagination.pageSize })
  }

  const handleReset = () => {
    setSearchParams({ execCategory: undefined, endpointType: undefined, status: undefined })
    fetchEndpoints({ pageNum: 1, pageSize: pagination.pageSize })
  }

  const columns = [
    {
      title: '服务ID',
      dataIndex: 'endpointId',
      key: 'endpointId',
      width: 200,
      ellipsis: true
    },
    {
      title: '服务名称',
      dataIndex: 'endpointName',
      key: 'endpointName',
      width: 150,
      render: (name, record) => (
        <a onClick={() => handleViewDetail(record)} style={{ cursor: 'pointer' }}>
          <Space>
            <span>{name}</span>
            <EyeOutlined style={{ color: '#1890ff', fontSize: 12 }} />
          </Space>
        </a>
      )
    },
    {
      title: '执行器类别',
      dataIndex: 'execCategory',
      key: 'execCategory',
      width: 150,
      render: (category) => {
        const option = execCategoryOptions.find(opt => opt.value === category)
        return option ? <Tag color="blue">{option.label}</Tag> : category
      }
    },
    {
      title: '服务类型',
      dataIndex: 'endpointType',
      key: 'endpointType',
      width: 150,
      render: (type) => {
        const option = computeTypeOptions.find(opt => opt.value === type)
        return option ? <Tag color="purple">{option.label}</Tag> : type
      }
    },
    {
      title: 'API地址',
      dataIndex: 'endpointUrl',
      key: 'endpointUrl',
      width: 250,
      ellipsis: true,
      render: (url) => (
        <span style={{ fontSize: 12, color: '#888' }} title={url}>
          {url}
        </span>
      )
    },
    {
      title: '超时时间',
      dataIndex: 'timeoutMs',
      key: 'timeoutMs',
      width: 100,
      render: (ms) => ms ? `${ms}ms` : '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 160,
      render: (time) => time ? new Date(time).toLocaleString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="编辑"
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此服务吗？"
            onConfirm={() => handleDelete(record.endpointId)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              title="删除"
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  useEffect(() => {
    fetchEndpoints()
    fetchComputeTypes()
  }, [])

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="执行器类别"
            style={{ width: 150 }}
            value={searchParams.execCategory}
            onChange={value => setSearchParams({ ...searchParams, execCategory: value })}
            allowClear
          >
            {execCategoryOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="服务类型"
            style={{ width: 140 }}
            value={searchParams.endpointType}
            onChange={value => setSearchParams({ ...searchParams, endpointType: value })}
            allowClear
          >
            {computeTypeOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 100 }}
            value={searchParams.status}
            onChange={value => setSearchParams({ ...searchParams, status: value })}
            allowClear
          >
            {statusOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            创建服务
          </Button>
        </Space>
      </Card>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={endpoints}
          rowKey="endpointId"
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

      <Modal
        title={modalMode === 'create' ? '创建服务' : '编辑服务'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="endpointName"
            label="服务名称"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input placeholder="请输入服务名称" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              name="execCategory"
              label="执行器类别"
              rules={[{ required: true, message: '请选择执行器类别' }]}
            >
              <Select placeholder="请选择执行器类别">
                {execCategoryOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="endpointType"
              label="服务类型"
              rules={[{ required: true, message: '请选择服务类型' }]}
            >
              <Select placeholder="请选择服务类型">
                {computeTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="endpointUrl"
            label="外部RestAPI地址"
            rules={[
              { required: true, message: '请输入API地址' },
              { type: 'url', message: '请输入有效的URL地址' }
            ]}
          >
            <Input placeholder="https://api.example.com/compute" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              name="timeoutMs"
              label="超时时间(ms)"
              rules={[{ required: true, message: '请输入超时时间' }]}
            >
              <InputNumber
                min={1000}
                max={300000}
                placeholder="60000"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="maxRetry"
              label="最大重试次数"
            >
              <InputNumber
                min={0}
                max={10}
                placeholder="3"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          <Divider orientation="left" plain style={{ fontSize: 12, color: '#999' }}>
            可选配置
          </Divider>

          <Form.Item
            name="headers"
            label="请求头配置(JSON)"
            tooltip="可选，用于配置自定义请求头"
          >
            <Input.TextArea
              key={`headers-${selectedEndpoint?.endpointId || 'new'}`}
              rows={3}
              placeholder='{"Authorization": "Bearer xxx"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="mlServiceConfig"
            label="机器学习模型服务配置(JSON)"
            tooltip="可选，仅在使用传统机器学习模型执行器类别时需要配置"
          >
            <Input.TextArea
              key={`mlServiceConfig-${selectedEndpoint?.endpointId || 'new'}`}
              rows={4}
              placeholder='{"model": "xxx", "version": "1.0"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="llmServiceConfig"
            label="LLM模型配置(JSON)"
            tooltip="可选，仅在使用大语言模型执行器类别时需要配置"
          >
            <Input.TextArea
              key={`llmServiceConfig-${selectedEndpoint?.endpointId || 'new'}`}
              rows={3}
              placeholder='{"model": "gpt-4", "temperature": 0.7}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="服务详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {detailEndpoint && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="服务ID" span={2}>{detailEndpoint.endpointId}</Descriptions.Item>
            <Descriptions.Item label="服务名称" span={2}>{detailEndpoint.endpointName}</Descriptions.Item>
            <Descriptions.Item label="执行器类别">
              {execCategoryOptions.find(opt => opt.value === detailEndpoint.execCategory)?.label || detailEndpoint.execCategory}
            </Descriptions.Item>
            <Descriptions.Item label="服务类型">
              {computeTypeOptions.find(opt => opt.value === detailEndpoint.endpointType)?.label || detailEndpoint.endpointType}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={detailEndpoint.status === 'ACTIVE' ? 'green' : 'red'}>
                {detailEndpoint.status === 'ACTIVE' ? '启用' : '禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="最大重试次数">{detailEndpoint.maxRetry}</Descriptions.Item>
            <Descriptions.Item label="外部RestAPI地址" span={2}>
              <a href={detailEndpoint.endpointUrl} target="_blank" rel="noopener noreferrer">
                {detailEndpoint.endpointUrl}
              </a>
            </Descriptions.Item>
            <Descriptions.Item label="超时时间">{detailEndpoint.timeoutMs}ms</Descriptions.Item>
            <Descriptions.Item label="请求头配置" span={2}>
              <pre style={{ margin: 0, fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, color: '#333' }}>
                {detailEndpoint.headers ? JSON.stringify(detailEndpoint.headers, null, 2) : '-'}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="机器学习模型服务配置" span={2}>
              <pre style={{ margin: 0, fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, color: '#333' }}>
                {detailEndpoint.mlServiceConfig ? JSON.stringify(detailEndpoint.mlServiceConfig, null, 2) : '-'}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="LLM模型配置" span={2}>
              <pre style={{ margin: 0, fontSize: 12, background: '#f5f5f5', padding: 8, borderRadius: 4, color: '#333' }}>
                {detailEndpoint.llmServiceConfig ? JSON.stringify(detailEndpoint.llmServiceConfig, null, 2) : '-'}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {detailEndpoint.createTime ? new Date(detailEndpoint.createTime).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="修改时间">
              {detailEndpoint.updateTime ? new Date(detailEndpoint.updateTime).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default ComputeEndpointManagement
