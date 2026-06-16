import React, { useState, useEffect, useRef } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Tag,
  Popconfirm,
  Card
} from 'antd'
import {
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'
import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  getPlans
} from '../../services/subscription'
import { useNavigate, useLocation } from 'react-router-dom'

const { Option } = Select

const ProductManagement = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [form] = Form.useForm()
  const [filterPlanId, setFilterPlanId] = useState(null)
  const locationInitializedRef = useRef(false)

  const planNameMap = React.useMemo(() => {
    const map = {}
    plans.forEach(plan => {
      map[plan.planId] = plan.planName
    })
    return map
  }, [plans])

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    if (!locationInitializedRef.current) {
      const initialPlanId = location.state?.planId
      if (initialPlanId) {
        setFilterPlanId(initialPlanId)
      } else {
        fetchProducts({ pageNum: 1, pageSize: 20 })
      }
      locationInitializedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (locationInitializedRef.current) {
      if (filterPlanId) {
        fetchProducts({ pageNum: 1, pageSize: 20, planId: filterPlanId })
      } else {
        fetchProducts({ pageNum: 1, pageSize: 20 })
      }
    }
  }, [filterPlanId])

  const handleViewPlan = (planId) => {
    navigate('/subscription-plans', { state: { planId } })
  }

  const handlePlanFilterChange = (planId) => {
    setFilterPlanId(planId)
  }

  const fetchProducts = async (params = {}) => {
    setLoading(true)
    try {
      const { pageNum = 1, pageSize = 20, planId: paramPlanId, ...rest } = params
      const requestParams = {
        pageNum,
        pageSize,
        ...rest
      }
      const effectivePlanId = paramPlanId !== undefined ? paramPlanId : filterPlanId
      if (effectivePlanId) {
        requestParams.planId = effectivePlanId
      }
      const response = await getProducts(requestParams)

      if (response.data) {
        setProducts(response.data || [])
        setPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total
        })
      }
    } catch (error) {
      message.error('获取产品列表失败')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await getPlans()
      if (response.data) {
        setPlans(response.data || [])
      }
    } catch (error) {
      message.error('获取套餐列表失败')
      console.error('Error fetching plans:', error)
    }
  }

  const handleTableChange = (pagination) => {
    fetchProducts({
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    })
  }

  const handleCreate = () => {
    setModalMode('create')
    setSelectedProduct(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (product) => {
    setModalMode('edit')
    setSelectedProduct(product)
    form.setFieldsValue({
      productCode: product.productCode,
      productName: product.productName,
      productType: product.productType,
      subscriptionPlanId: product.subscriptionPlanId,
      subscriptionMonths: product.subscriptionMonths,
      tokenAmount: product.tokenAmount,
      originalPrice: product.originalPrice,
      currentPrice: product.currentPrice,
      pointsDeductEnabled: product.pointsDeductEnabled === 1 || product.pointsDeductEnabled === true,
      maxPointsDeduct: product.maxPointsDeduct,
      sortOrder: product.sortOrder,
      isActive: product.isActive === 1 || product.isActive === true
    })
    setModalVisible(true)
  }

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        productCode: values.productCode,
        productName: values.productName,
        productType: values.productType,
        subscriptionPlanId: values.subscriptionPlanId || null,
        subscriptionMonths: values.productType === 'SUBSCRIPTION' ? values.subscriptionMonths : null,
        tokenAmount: values.productType === 'TOKEN_PACK' ? values.tokenAmount : null,
        originalPrice: values.originalPrice,
        currentPrice: values.currentPrice,
        pointsDeductEnabled: values.pointsDeductEnabled ? 1 : 0,
        maxPointsDeduct: values.maxPointsDeduct,
        sortOrder: values.sortOrder,
        isActive: values.isActive ? 1 : 0
      }

      if (modalMode === 'create') {
        await createProduct(data)
        message.success('产品创建成功')
      } else {
        await updateProduct(selectedProduct.productId, data)
        message.success('产品更新成功')
      }

      setModalVisible(false)
      fetchProducts({
        pageNum: pagination.current,
        pageSize: pagination.pageSize
      })
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写完整信息')
      } else {
        message.error(`${modalMode === 'create' ? '创建' : '更新'}失败`)
        console.error('Error submitting product:', error)
      }
    }
  }

  const handleToggleStatus = async (product) => {
    try {
      const newStatus = !(product.isActive === 1 || product.isActive === true)
      await updateProductStatus(product.productId, newStatus)
      message.success(newStatus ? '产品已上架' : '产品已下架')
      fetchProducts({
        pageNum: pagination.current,
        pageSize: pagination.pageSize
      })
    } catch (error) {
      message.error('更新状态失败')
      console.error('Error updating product status:', error)
    }
  }

  const columns = [
    {
      title: '产品ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 200,
      ellipsis: true
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 180
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200
    },
    {
      title: '产品类型',
      dataIndex: 'productType',
      key: 'productType',
      width: 120,
      render: (type) => {
        const typeMap = {
          'SUBSCRIPTION': '订阅套餐',
          'TOKEN_PACK': 'Token流量包'
        }
        return <Tag color={type === 'SUBSCRIPTION' ? 'blue' : 'green'}>
          {typeMap[type] || type}
        </Tag>
      }
    },
    {
      title: '关联套餐',
      dataIndex: 'subscriptionPlanId',
      key: 'subscriptionPlanId',
      width: 150,
      render: (planId) => {
        if (!planId) return '-'
        return (
          <a onClick={() => handleViewPlan(planId)} style={{ cursor: 'pointer' }}>
            <Space>
              <span>{planNameMap[planId] || planId}</span>
              <EyeOutlined style={{ color: '#1890ff', fontSize: 12 }} />
            </Space>
          </a>
        )
      }
    },
    {
      title: '订阅月数',
      dataIndex: 'subscriptionMonths',
      key: 'subscriptionMonths',
      width: 100,
      render: (months) => months ? `${months}个月` : '-'
    },
    {
      title: 'Token数量',
      dataIndex: 'tokenAmount',
      key: 'tokenAmount',
      width: 120,
      render: (amount) => amount ? `${amount}个` : '-'
    },
    {
      title: '原价',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 100,
      render: (price) => `¥${price}`
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      render: (price) => `¥${price}`
    },
    {
      title: '积分抵扣',
      dataIndex: 'pointsDeductEnabled',
      key: 'pointsDeductEnabled',
      width: 100,
      render: (enabled) => {
        const isEnabled = enabled === true || enabled === 1
        return (
          <Tag color={isEnabled ? 'green' : 'default'}>
            {isEnabled ? '支持' : '不支持'}
          </Tag>
        )
      }
    },
    {
      title: '最大积分抵扣数量',
      dataIndex: 'maxPointsDeduct',
      key: 'maxPointsDeduct',
      width: 140,
      render: (max) => {
        if (max === null || max === undefined || max === 0) {
          return <span style={{ color: '#999' }}>不限制</span>
        }
        return <span>{max}</span>
      }
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => {
        const active = isActive === true || isActive === 1
        return (
          <Tag color={active ? 'green' : 'red'}>
            {active ? '上架' : '下架'}
          </Tag>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="编辑"
          >
            编辑
          </Button>
          <Popconfirm
            title={`确定要${(record.isActive === true || record.isActive === 1) ? '下架' : '上架'}吗？`}
            onConfirm={() => handleToggleStatus(record)}
          >
            <Button
              type="link"
              title={(record.isActive === true || record.isActive === 1) ? '下架' : '上架'}
            >
              {(record.isActive === true || record.isActive === 1) ? '下架' : '上架'}
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card size="small" style={{ marginBottom: 8 }}>
        <Space>
          <span>套餐过滤：</span>
          <Select
            style={{ width: 200 }}
            placeholder="全部套餐"
            allowClear
            value={filterPlanId}
            onChange={handlePlanFilterChange}
          >
            {plans.map(plan => (
              <Option key={plan.planId} value={plan.planId}>
                {plan.planName}
              </Option>
            ))}
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchProducts({
              pageNum: pagination.current,
              pageSize: pagination.pageSize
            })}
            size="small"
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="small"
          >
            新增产品
          </Button>
        </Space>
      </Card>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={products}
          rowKey="productId"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            size: 'small'
          }}
          onChange={handleTableChange}
          scroll={{ x: 2000 }}
          size="small"
        />
      </div>

      <Modal
        title={modalMode === 'create' ? '新增产品' : '编辑产品'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }} style={{ marginBottom: 12 }}>
          <Form.Item
            name="productCode"
            label="产品编码"
            rules={[{ required: true, message: '请输入产品编码' }]}
          >
            <Input placeholder="例如：STD_MONTH_1M" />
          </Form.Item>
          <Form.Item
            name="productName"
            label="产品名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input placeholder="例如：标准版月付+10万Token" />
          </Form.Item>
          <Form.Item
            name="productType"
            label="产品类型"
            rules={[{ required: true, message: '请选择产品类型' }]}
          >
            <Select placeholder="请选择产品类型">
              <Option value="SUBSCRIPTION">订阅套餐</Option>
              <Option value="TOKEN_PACK">Token流量包</Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.productType !== currentValues.productType}>
            {({ getFieldValue }) => {
              const productType = getFieldValue('productType')
              if (productType === 'SUBSCRIPTION') {
                return (
                  <>
                    <Form.Item
                      name="subscriptionPlanId"
                      label="关联套餐"
                      rules={[{ required: true, message: '请选择套餐' }]}
                    >
                      <Select placeholder="请选择套餐" allowClear>
                        {plans.map(plan => (
                          <Option key={plan.planId} value={plan.planId}>
                            {plan.planName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      name="subscriptionMonths"
                      label="订阅月数"
                      rules={[{ required: true, message: '请输入订阅月数' }]}
                    >
                      <InputNumber min={1} placeholder="例如：1" style={{ width: '100%' }} />
                    </Form.Item>
                  </>
                )
              } else if (productType === 'TOKEN_PACK') {
                return (
                  <Form.Item
                    name="tokenAmount"
                    label="Token数量"
                    rules={[{ required: true, message: '请输入Token数量' }]}
                  >
                    <InputNumber min={1} precision={0} placeholder="例如：100" style={{ width: '100%' }} />
                  </Form.Item>
                )
              }
              return null
            }}
          </Form.Item>
          <Form.Item
            name="originalPrice"
            label="原价"
            rules={[{ required: true, message: '请输入原价' }]}
          >
            <InputNumber min={0} precision={2} placeholder="0.00" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="currentPrice"
            label="现价"
            rules={[{ required: true, message: '请输入现价' }]}
          >
            <InputNumber min={0} precision={2} placeholder="0.00" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="pointsDeductEnabled"
            label="积分抵扣"
            valuePropName="checked"
          >
            <Switch checkedChildren="支持" unCheckedChildren="不支持" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.pointsDeductEnabled !== currentValues.pointsDeductEnabled}>
            {({ getFieldValue }) => {
              const enabled = getFieldValue('pointsDeductEnabled')
              if (enabled) {
                return (
                  <Form.Item
                    name="maxPointsDeduct"
                    label="最大抵扣数量"
                  >
                    <InputNumber min={0} placeholder="0表示不限制" style={{ width: '100%' }} />
                  </Form.Item>
                )
              }
              return null
            }}
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序"
            rules={[{ required: true, message: '请输入排序' }]}
          >
            <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="上架状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="上架" unCheckedChildren="下架" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProductManagement
