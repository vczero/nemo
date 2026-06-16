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
  Switch,
  message,
  Descriptions,
  Tag,
  Popconfirm,
  Popover,
  List,
  Card,
  Divider
} from 'antd'
import {
  EditOutlined,
  StarOutlined,
  StarFilled,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
  MinusCircleOutlined,
  PlusCircleOutlined
} from '@ant-design/icons'
import {
  getPlans,
  createPlan,
  updatePlan,
  setRecommendedPlan,
  getSubscriptionFeatures
} from '../../services/subscription'
import { useNavigate, useLocation } from 'react-router-dom'

const { Option } = Select

const planTypeOptions = [
  { value: 'FREE', label: '免费版' },
  { value: 'STANDARD', label: '标准版' },
  { value: 'PRIVATE', label: '私有部署版' }
]

const PlanManagement = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [editForm] = Form.useForm()
  const [detailVisible, setDetailVisible] = useState(false)
  const [detailPlan, setDetailPlan] = useState(null)
  const [featureOptions, setFeatureOptions] = useState([])

  const fetchPlans = async (params = {}) => {
    setLoading(true)
    try {
      const { pageNum = 1, pageSize = 20, ...rest } = params
      const response = await getPlans({
        pageNum,
        pageSize,
        ...rest
      })
      if (response.data) {
        setPlans(response.data || [])
        setPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total
        })
      }
    } catch (error) {
      message.error('获取套餐列表失败')
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFeatures = async () => {
    try {
      const response = await getSubscriptionFeatures()
      if (response.data) {
        setFeatureOptions(response.data || [])
      }
    } catch (error) {
      console.error('Error fetching features:', error)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setSelectedPlan(null)
    editForm.resetFields()
    editForm.setFieldsValue({
      planType: 'STANDARD',
      isActive: true,
      isRecommended: false,
      sortOrder: 0,
      monthlyPrice: 0,
      pricingRules: []
    })
    setModalVisible(true)
  }

  const handleViewProducts = (planId) => {
    navigate('/products', { state: { planId } })
  }

  const handleViewDetail = async (plan) => {
    setDetailPlan(plan)
    setDetailVisible(true)
  }

  const handleEdit = (plan) => {
    setModalMode('edit')
    setSelectedPlan(plan)
    editForm.setFieldsValue({
      planName: plan.planName,
      planDescription: plan.planDescription,
      planType: plan.planType,
      monthlyPrice: plan.monthlyPrice,
      pricingRules: plan.pricingRules || [],
      sortOrder: plan.sortOrder,
      isActive: plan.isActive === 1 || plan.isActive === true,
      isRecommended: plan.isRecommended === 1 || plan.isRecommended === true,
      features: plan.features || []
    })
    setModalVisible(true)
  }

  const handleModalSubmit = async () => {
    try {
      const values = await editForm.validateFields()
      if (modalMode === 'create') {
        await createPlan({
          planCode: values.planCode,
          planName: values.planName,
          planDescription: values.planDescription,
          planType: values.planType,
          monthlyPrice: values.monthlyPrice,
          pricingRules: values.pricingRules || [],
          features: values.features || [],
          sortOrder: values.sortOrder,
          isActive: values.isActive ? 1 : 0,
          isRecommended: values.isRecommended ? 1 : 0
        })
        message.success('套餐创建成功')
      } else {
        await updatePlan(selectedPlan.planId, {
          planName: values.planName,
          planDescription: values.planDescription,
          planType: values.planType,
          monthlyPrice: values.monthlyPrice,
          pricingRules: values.pricingRules || [],
          features: values.features || [],
          sortOrder: values.sortOrder,
          isActive: values.isActive ? 1 : 0
        })
        message.success('套餐更新成功')
      }
      setModalVisible(false)
      fetchPlans({
        pageNum: pagination.current,
        pageSize: pagination.pageSize
      })
    } catch (error) {
      if (error.errorFields) {
        message.error('请填写完整信息')
      } else {
        message.error(`${modalMode === 'create' ? '创建' : '更新'}失败`)
        console.error('Error submitting plan:', error)
      }
    }
  }

  const handleSetRecommended = async (planId) => {
    try {
      await setRecommendedPlan(planId)
      message.success('设置主推套餐成功')
      fetchPlans({
        pageNum: pagination.current,
        pageSize: pagination.pageSize
      })
    } catch (error) {
      message.error('设置主推套餐失败')
      console.error('Error setting recommended plan:', error)
    }
  }

  const handleTableChange = (pagination) => {
    fetchPlans({
      pageNum: pagination.current,
      pageSize: pagination.pageSize
    })
  }

  const columns = [
    {
      title: '套餐ID',
      dataIndex: 'planId',
      key: 'planId',
      width: 200,
      ellipsis: true
    },
    {
      title: '套餐编码',
      dataIndex: 'planCode',
      key: 'planCode',
      width: 120
    },
    {
      title: '套餐类型',
      dataIndex: 'planType',
      key: 'planType',
      width: 120,
      render: (planType) => {
        const option = planTypeOptions.find(opt => opt.value === planType)
        return option ? <Tag color="blue">{option.label}</Tag> : planType
      }
    },
    {
      title: '套餐名称',
      dataIndex: 'planName',
      key: 'planName',
      width: 150,
      render: (planName, record) => (
        <a onClick={() => handleViewProducts(record.planId)} style={{ cursor: 'pointer' }}>
          <Space>
            <span>{planName}</span>
            <EyeOutlined style={{ color: '#1890ff', fontSize: 12 }} />
          </Space>
        </a>
      )
    },
    {
      title: '月费价格',
      dataIndex: 'monthlyPrice',
      key: 'monthlyPrice',
      width: 120,
      render: (price) => `¥${price}`
    },
    {
      title: '计费规则',
      dataIndex: 'pricingRules',
      key: 'pricingRules',
      width: 150,
      render: (pricingRules) => {
        if (!pricingRules || pricingRules.length === 0) {
          return <Tag color="default">无规则</Tag>
        }

        const ruleContent = (
          <List
            size="small"
            dataSource={pricingRules}
            renderItem={(rule, index) => (
              <List.Item key={index}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{rule.name || `${rule.months}个月`}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>
                    {rule.months}个月 | 折扣: {rule.discount}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )

        return (
          <Popover
            content={ruleContent}
            title="计费规则列表"
            trigger="click"
            placement="right"
          >
            <Tag color="blue" style={{ cursor: 'pointer' }}>
              {pricingRules.length}条规则
            </Tag>
          </Popover>
        )
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
            {active ? '启用' : '禁用'}
          </Tag>
        )
      }
    },
    {
      title: '主推',
      dataIndex: 'isRecommended',
      key: 'isRecommended',
      width: 80,
      render: (isRecommended) => {
        const recommended = isRecommended === true || isRecommended === 1
        return recommended ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />
      }
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
          >
            编辑
          </Button>
          {!record.isRecommended && (
            <Popconfirm
              title="确定要设置为主推套餐吗？"
              onConfirm={() => handleSetRecommended(record.planId)}
            >
              <Button
                type="link"
                icon={<StarOutlined />}
                title="设置为主推"
              >
                主推
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  useEffect(() => {
    fetchPlans()
    fetchFeatures()
  }, [])

  useEffect(() => {
    if (location.state?.planId && plans.length > 0) {
      const plan = plans.find(p => p.planId === location.state.planId)
      if (plan) {
        handleViewDetail(plan)
      }
    }
  }, [location.state, plans])

  return (
    <div>
      <div className="action-bar" style={{ marginBottom: 8 }}>
        <Space size="small">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            size="small"
          >
            创建套餐
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchPlans({
              pageNum: pagination.current,
              pageSize: pagination.pageSize
            })}
            size="small"
          >
            刷新
          </Button>
        </Space>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={plans}
          rowKey="planId"
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
        title={modalMode === 'create' ? '创建套餐' : '编辑套餐'}
        open={modalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
      >
        <Form form={editForm} layout="vertical">
          {modalMode === 'create' && (
            <Form.Item
              name="planCode"
              label="套餐编码"
              rules={[
                { required: true, message: '请输入套餐编码' },
                { pattern: /^[A-Z_]+$/, message: '套餐编码只能包含大写字母和下划线' }
              ]}
            >
              <Input placeholder="例如：STANDARD、PRO" />
            </Form.Item>
          )}
          <Form.Item
            name="planName"
            label="套餐名称"
            rules={[{ required: true, message: '请输入套餐名称' }]}
          >
            <Input placeholder="请输入套餐名称" />
          </Form.Item>
          <Form.Item
            name="planType"
            label="套餐类型"
            rules={[{ required: true, message: '请选择套餐类型' }]}
          >
            <Select placeholder="请选择套餐类型">
              {planTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="planDescription"
            label="套餐描述"
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入套餐描述"
            />
          </Form.Item>
          <Form.Item
            name="features"
            label="功能特性"
            tooltip="选择的顺序即为功能特性的展示顺序"
          >
            <Select
              mode="multiple"
              placeholder="请选择功能特性"
              maxTagCount="responsive"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              fieldNames={{ label: 'title', value: 'name' }}
              options={featureOptions}
            />
          </Form.Item>
          <Form.Item
            name="monthlyPrice"
            label="月费价格"
            rules={[{ required: true, message: '请输入月费价格' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              placeholder="0.00"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="pricingRules"
            label="计费规则"
            tooltip="配置不同订阅时长的折扣规则，如：订阅12个月享受88.8折优惠"
          >
            <Form.List name="pricingRules">
              {(fields, { add, remove }) => (
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
                  {fields.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 40px', gap: '0 12px', marginBottom: 8, fontWeight: 500, color: '#666', fontSize: 12 }}>
                      <div>订阅月数</div>
                      <div>折扣率</div>
                      <div>规则名称</div>
                      <div></div>
                    </div>
                  )}
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 2fr 40px', gap: '0 12px', marginBottom: 8, alignItems: 'start' }}
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'months']}
                        rules={[{ required: true, message: '请输入' }]}
                        style={{ marginBottom: 8 }}
                      >
                        <InputNumber
                          min={1}
                          placeholder="12"
                          style={{ width: '100%' }}
                          addonAfter="个月"
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'discount']}
                        rules={[{ required: true, message: '请输入' }]}
                        style={{ marginBottom: 8 }}
                      >
                        <InputNumber
                          min={0.1}
                          max={1.0}
                          step={0.01}
                          placeholder="0.888"
                          style={{ width: '100%' }}
                          addonAfter="折"
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'name']}
                        style={{ marginBottom: 8 }}
                      >
                        <Input placeholder="年费优惠" style={{ width: '100%' }} />
                      </Form.Item>
                      <MinusCircleOutlined
                        onClick={() => remove(name)}
                        style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 18, marginTop: 4 }}
                      />
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusCircleOutlined />}
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    添加计费规则
                  </Button>
                </div>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="排序"
            rules={[{ required: true, message: '请输入排序' }]}
          >
            <InputNumber
              min={0}
              placeholder="0"
              style={{ width: '100%' }}
            />
          </Form.Item>
          {modalMode === 'create' && (
            <Form.Item
              name="isRecommended"
              label="设置为主推套餐"
              valuePropName="checked"
            >
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          )}
          <Form.Item
            name="isActive"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="套餐详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {detailPlan && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="套餐ID" span={2}>{detailPlan.planId}</Descriptions.Item>
            <Descriptions.Item label="套餐编码">{detailPlan.planCode}</Descriptions.Item>
            <Descriptions.Item label="套餐类型">
              {planTypeOptions.find(opt => opt.value === detailPlan.planType)?.label || detailPlan.planType}
            </Descriptions.Item>
            <Descriptions.Item label="套餐名称" span={2}>{detailPlan.planName}</Descriptions.Item>
            <Descriptions.Item label="套餐描述" span={2}>{detailPlan.planDescription || '-'}</Descriptions.Item>
            <Descriptions.Item label="月费价格">¥{detailPlan.monthlyPrice}</Descriptions.Item>
            <Descriptions.Item label="计费规则">
              {detailPlan.pricingRules && detailPlan.pricingRules.length > 0 ? (
                <Space direction="vertical" size={4}>
                  {detailPlan.pricingRules.map((rule, index) => (
                    <Tag key={index} color="blue">
                      {rule.name || `${rule.months}个月`}: {rule.months}个月 | 折扣: {rule.discount}
                    </Tag>
                  ))}
                </Space>
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="排序">{detailPlan.sortOrder}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {detailPlan.isActive ? (
                <Tag color="green">启用</Tag>
              ) : (
                <Tag color="red">禁用</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="主推">
              {detailPlan.isRecommended ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default PlanManagement
