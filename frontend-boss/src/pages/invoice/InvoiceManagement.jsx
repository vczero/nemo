import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Card,
  Drawer,
  Descriptions,
  Modal,
  message,
  Tooltip,
  Upload,
  Form,
  Radio
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UploadOutlined,
  EditOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getInvoiceList,
  getInvoiceDetail,
  issueInvoice,
  updateInvoiceStatus
} from '../../services/invoice'

const { Option } = Select

// 发票状态映射
const StatusMap = {
  PENDING: '待开具',
  PROCESSING: '开具中',
  ISSUED: '已开具'
}

const StatusColorMap = {
  PENDING: 'gold',
  PROCESSING: 'blue',
  ISSUED: 'green'
}

// 发票类型映射
const TypeMap = {
  ENTERPRISE: '企业',
  PERSONAL: '个人'
}

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',
    invoiceType: ''
  })
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // 开具发票弹窗
  const [issueModalVisible, setIssueModalVisible] = useState(false)
  const [issueForm] = Form.useForm()
  const [issueLoading, setIssueLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')

  // 更新状态弹窗
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [statusForm] = Form.useForm()
  const [statusLoading, setStatusLoading] = useState(false)

  // 获取发票列表
  const fetchInvoices = async (pageNum = 1, pageSize = 20) => {
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

      const response = await getInvoiceList(params)

      if (response.data) {
        setInvoices(response.data || [])
        setPagination({
          current: response.pageNum,
          pageSize: response.pageSize,
          total: response.total
        })
      }
    } catch (error) {
      message.error('获取发票列表失败')
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  // 查看发票详情
  const handleViewDetail = async (invoice) => {
    setSelectedInvoice(invoice)
    setDetailVisible(true)

    setDetailLoading(true)
    try {
      const response = await getInvoiceDetail(invoice.invoiceId)
      if (response.data) {
        setSelectedInvoice(response.data)
      }
    } catch (error) {
      message.error('获取发票详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  // 关闭详情抽屉
  const handleCloseDetail = () => {
    setDetailVisible(false)
    setSelectedInvoice(null)
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
      invoiceType: ''
    })
  }

  // 搜索
  const handleSearch = () => {
    fetchInvoices(1, pagination.pageSize)
  }

  // 刷新
  const handleRefresh = () => {
    fetchInvoices(pagination.current, pagination.pageSize)
  }

  // 分页变化
  const handleTableChange = (newPagination) => {
    fetchInvoices(newPagination.current, newPagination.pageSize)
  }

  // 打开开具发票弹窗
  const handleOpenIssueModal = (invoice) => {
    setSelectedInvoice(invoice)
    issueForm.resetFields()
    issueForm.setFieldsValue({
      invoiceNo: invoice.invoiceNo || ''
    })
    setUploadedFileUrl(invoice.invoiceFileUrl || '')
    setIssueModalVisible(true)
  }

  // 上传文件
  const handleUpload = async (file) => {
    // 验证文件类型
    const isValidType = file.type === 'image/png' || file.type === 'application/pdf'
    if (!isValidType) {
      message.error('只能上传 PNG 或 PDF 格式的文件！')
      return false
    }

    // 验证文件大小 (最大 10MB)
    const isValidSize = file.size / 1024 / 1024 < 10
    if (!isValidSize) {
      message.error('文件大小不能超过 10MB！')
      return false
    }

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', 'INVOICE')

    try {
      const response = await fetch('/boss/api/files/add', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success && result.value) {
        setUploadedFileUrl(result.value.url)
        message.success('文件上传成功')
      } else {
        message.error(result.message || '文件上传失败')
      }
    } catch (error) {
      message.error('文件上传失败')
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }

    return false // 阻止默认上传行为
  }

  // 提交开具发票
  const handleSubmitIssue = async () => {
    try {
      const values = await issueForm.validateFields()

      if (!uploadedFileUrl) {
        message.error('请上传发票文件')
        return
      }

      setIssueLoading(true)
      await issueInvoice(selectedInvoice.invoiceId, uploadedFileUrl)
      message.success('发票开具成功')
      setIssueModalVisible(false)
      fetchInvoices(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error('发票开具失败')
      console.error('Issue invoice error:', error)
    } finally {
      setIssueLoading(false)
    }
  }

  // 打开更新状态弹窗
  const handleOpenStatusModal = (invoice) => {
    setSelectedInvoice(invoice)
    statusForm.resetFields()
    statusForm.setFieldsValue({
      status: invoice.status || 'PENDING',
      rejectReason: invoice.rejectReason || ''
    })
    setUploadedFileUrl(invoice.invoiceFileUrl || '')
    setStatusModalVisible(true)
  }

  // 提交更新状态
  const handleSubmitStatus = async () => {
    try {
      const values = await statusForm.validateFields()

      setStatusLoading(true)
      await updateInvoiceStatus(selectedInvoice.invoiceId, {
        status: values.status,
        rejectReason: values.rejectReason || null,
        invoiceFileUrl: uploadedFileUrl || null
      })
      message.success('状态更新成功')
      setStatusModalVisible(false)
      fetchInvoices(pagination.current, pagination.pageSize)
    } catch (error) {
      message.error('状态更新失败')
      console.error('Update status error:', error)
    } finally {
      setStatusLoading(false)
    }
  }

  // 初始化
  useEffect(() => {
    fetchInvoices()
  }, [])

  // 表格列定义
  const columns = [
    {
      title: '发票编号',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      width: 180,
      render: (text, record) => (
        <a onClick={() => handleViewDetail(record)}>{text || '-'}</a>
      )
    },
    {
      title: '发票类型',
      dataIndex: 'invoiceType',
      key: 'invoiceType',
      width: 100,
      render: (type) => (
        <Tag color={type === 'ENTERPRISE' ? 'blue' : 'cyan'}>
          {TypeMap[type] || type}
        </Tag>
      )
    },
    {
      title: '发票抬头',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '开票金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => `¥${Number(amount || 0).toFixed(2)}`
    },
    {
      title: '信用代码',
      dataIndex: 'creditCode',
      key: 'creditCode',
      width: 180,
      ellipsis: true,
      render: (text) => text || '-'
    },
    {
      title: '接收邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={StatusColorMap[status] || 'default'}>
          {StatusMap[status] || status}
        </Tag>
      )
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 170,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="开具发票">
            <Button
              type="link"
              size="small"
              icon={<UploadOutlined />}
              onClick={() => handleOpenIssueModal(record)}
            />
          </Tooltip>
          <Tooltip title="修改状态">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenStatusModal(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ]

  return (
    <div className="invoice-management">
      {/* 筛选区域 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="发票编号/抬头/邮箱"
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            allowClear
            onPressEnter={handleSearch}
          />

          <Select
            placeholder="发票状态"
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
            placeholder="发票类型"
            style={{ width: 120 }}
            value={filters.invoiceType}
            onChange={(value) => handleFilterChange('invoiceType', value)}
            allowClear
          >
            {Object.entries(TypeMap).map(([key, label]) => (
              <Option key={key} value={key}>{label}</Option>
            ))}
          </Select>

          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>

          <Button onClick={handleResetFilters}>
            重置
          </Button>

          <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 发票表格 */}
      <Table
        columns={columns}
        dataSource={invoices}
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        onChange={handleTableChange}
        rowKey="invoiceId"
        scroll={{ x: 1400 }}
        size="middle"
      />

      {/* 发票详情抽屉 */}
      <Drawer
        title="发票详情"
        placement="right"
        width={680}
        onClose={handleCloseDetail}
        open={detailVisible}
        loading={detailLoading}
      >
        {selectedInvoice && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="发票ID">{selectedInvoice.invoiceId}</Descriptions.Item>
            <Descriptions.Item label="发票编号">{selectedInvoice.invoiceNo || '-'}</Descriptions.Item>
            <Descriptions.Item label="发票状态" span={2}>
              <Tag color={StatusColorMap[selectedInvoice.status]}>
                {StatusMap[selectedInvoice.status] || selectedInvoice.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="发票类型">
              <Tag color={selectedInvoice.invoiceType === 'ENTERPRISE' ? 'blue' : 'cyan'}>
                {TypeMap[selectedInvoice.invoiceType] || selectedInvoice.invoiceType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="开票金额">
              <strong style={{ color: '#ff4d4f' }}>
                ¥{Number(selectedInvoice.amount || 0).toFixed(2)}
              </strong>
            </Descriptions.Item>
            <Descriptions.Item label="发票抬头" span={2}>
              {selectedInvoice.title || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="信用代码" span={2}>
              {selectedInvoice.creditCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="接收邮箱" span={2}>
              {selectedInvoice.email || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>
              {selectedInvoice.remark || '-'}
            </Descriptions.Item>
            {selectedInvoice.rejectReason && (
              <Descriptions.Item label="拒绝原因" span={2}>
                <span style={{ color: '#ff4d4f' }}>{selectedInvoice.rejectReason}</span>
              </Descriptions.Item>
            )}
            {selectedInvoice.invoiceFileUrl && (
              <Descriptions.Item label="发票文件" span={2}>
                <a href={selectedInvoice.invoiceFileUrl} target="_blank" rel="noopener noreferrer">
                  查看文件
                </a>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="申请时间">
              {selectedInvoice.applyTime ? dayjs(selectedInvoice.applyTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="开具时间">
              {selectedInvoice.issueTime ? dayjs(selectedInvoice.issueTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间" span={2}>
              {selectedInvoice.createTime ? dayjs(selectedInvoice.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      {/* 开具发票弹窗 */}
      <Modal
        title="开具发票"
        open={issueModalVisible}
        onOk={handleSubmitIssue}
        onCancel={() => setIssueModalVisible(false)}
        confirmLoading={issueLoading}
        width={500}
      >
        <Form form={issueForm} layout="vertical">
          <Form.Item label="发票编号">
            <Input value={selectedInvoice?.invoiceNo || '-'} disabled />
          </Form.Item>
          <Form.Item label="发票抬头">
            <Input value={selectedInvoice?.title || '-'} disabled />
          </Form.Item>
          <Form.Item label="开票金额">
            <Input value={`¥${Number(selectedInvoice?.amount || 0).toFixed(2)}`} disabled />
          </Form.Item>
          <Form.Item
            label="上传发票文件 (PNG/PDF)"
            required
          >
            <Upload
              accept=".png,.pdf"
              beforeUpload={handleUpload}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? '上传中...' : '选择文件'}
              </Button>
            </Upload>
            {uploadedFileUrl && (
              <div style={{ marginTop: 8 }}>
                <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">
                  已上传文件
                </a>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* 更新状态弹窗 */}
      <Modal
        title="修改发票状态"
        open={statusModalVisible}
        onOk={handleSubmitStatus}
        onCancel={() => setStatusModalVisible(false)}
        confirmLoading={statusLoading}
        width={500}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="发票状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Radio.Group>
              {Object.entries(StatusMap).map(([key, label]) => (
                <Radio key={key} value={key}>{label}</Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
          >
            {({ getFieldValue }) =>
              getFieldValue('status') === 'PROCESSING' && (
                <Form.Item name="rejectReason" label="拒绝原因">
                  <Input.TextArea rows={3} placeholder="请输入拒绝原因（选填）" />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item label="上传发票文件 (PNG/PDF)">
            <Upload
              accept=".png,.pdf"
              beforeUpload={handleUpload}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                {uploading ? '上传中...' : '选择文件'}
              </Button>
            </Upload>
            {uploadedFileUrl && (
              <div style={{ marginTop: 8 }}>
                <a href={uploadedFileUrl} target="_blank" rel="noopener noreferrer">
                  已上传文件
                </a>
              </div>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InvoiceManagement
