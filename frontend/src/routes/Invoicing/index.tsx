import React, { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import {
  App as AntApp,
  Alert,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Skeleton,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import type { TabsProps } from 'antd'
import {
  BankOutlined,
  FileTextOutlined,
  MailOutlined,
  SnippetsOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import ContentWrapper from '@/components/ContentWrapper'
import {
  GET_AVAILABLE_INVOICE_AMOUNT_ENDPOINT,
  applyInvoice,
  getAvailableInvoiceAmount,
} from '@/apis'
import type { TApplyInvoiceRequest, TInvoiceAmountResponse } from '@/apis/types'
import { useUser } from '@/contexts/UserContext'
import { getLocalStorageItem, setLocalStorageItem } from '@/utils/utils'

type TInvoiceType = TApplyInvoiceRequest['invoiceType']
type TInvoiceCachedFormValues = Pick<
  TInvoiceFormValues,
  'creditCode' | 'email' | 'remark' | 'title'
>
type TInvoiceFormCache = Partial<Record<TInvoiceType, TInvoiceCachedFormValues>>

interface TInvoiceFormValues {
  amount: number | null
  creditCode?: string
  email: string
  remark?: string
  title: string
}

const INVOICE_CATEGORY_TEXT = '增值税普通发票'
const INVOICE_FORM_CACHE_KEY = 'ywllab:invoice-form-cache'

const formatCurrency = (value = 0) => {
  const safeValue = Number.isFinite(value) ? value : 0
  return `¥${safeValue.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const readInvoiceFormCache = (): TInvoiceFormCache => {
  return getLocalStorageItem<TInvoiceFormCache>(INVOICE_FORM_CACHE_KEY, {})!
}

const getCachedFormByType = (invoiceType: TInvoiceType) => {
  const cache = readInvoiceFormCache()
  return cache[invoiceType]
}

const saveCachedFormByType = (
  invoiceType: TInvoiceType,
  formValues: TInvoiceCachedFormValues
) => {
  const cache = readInvoiceFormCache()
  cache[invoiceType] = formValues
  setLocalStorageItem(INVOICE_FORM_CACHE_KEY, cache)
}

const Invoicing: React.FC = () => {
  const { message } = AntApp.useApp()
  const { user } = useUser()
  const [invoiceType, setInvoiceType] = useState<TInvoiceType>('ENTERPRISE')
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm<TInvoiceFormValues>()

  const {
    data: amountData,
    error,
    isLoading,
    mutate: mutateAmountData,
  } = useSWR<TInvoiceAmountResponse>(
    GET_AVAILABLE_INVOICE_AMOUNT_ENDPOINT,
    getAvailableInvoiceAmount,
  )

  const availableAmount = amountData?.availableAmount ?? 0
  const isEnterprise = invoiceType === 'ENTERPRISE'

  const tabItems = useMemo<TabsProps['items']>(
    () => [
      {
        key: 'ENTERPRISE',
        label: (
          <span className="font-medium">
            <BankOutlined className="me-1" />
            企业发票
          </span>
        ),
      },
      {
        key: 'PERSONAL',
        label: (
          <span className="font-medium">
            <UserOutlined className="me-1" />
            个人发票
          </span>
        ),
      },
    ],
    []
  )

  const amountCards = useMemo(
    () => [
      {
        icon: <WalletOutlined className="text-base" />,
        label: '可开票金额',
        value: formatCurrency(availableAmount),
      },
      {
        icon: <SnippetsOutlined className="text-base" />,
        label: '已开票金额',
        value: formatCurrency(amountData?.totalInvoicedAmount ?? 0),
      },
      {
        icon: <FileTextOutlined className="text-base" />,
        label: '已支付订单金额',
        value: formatCurrency(amountData?.totalPaidAmount ?? 0),
      },
    ],
    [
      amountData?.totalInvoicedAmount,
      amountData?.totalPaidAmount,
      availableAmount,
    ]
  )

  useEffect(() => {
    const cachedForm = getCachedFormByType(invoiceType)
    const defaultEmail = user?.email || ''

    if (cachedForm) {
      form.setFieldsValue({
        amount: null,
        creditCode: cachedForm.creditCode,
        email: cachedForm.email || defaultEmail,
        remark: cachedForm.remark,
        title: cachedForm.title,
      })
      return
    }

    form.resetFields(['amount', 'title', 'creditCode', 'remark'])
    if (defaultEmail) {
      form.setFieldValue('email', defaultEmail)
    }
  }, [form, invoiceType, user?.email])

  const handleTabChange = (key: string) => {
    // if (isLoading) return
    const nextType = key as TInvoiceType
    setInvoiceType(nextType)
  }

  const handleSubmit = async (values: TInvoiceFormValues) => {
    const request: TApplyInvoiceRequest = {
      amount: Number(values.amount),
      email: values.email.trim(),
      invoiceType,
      remark: values.remark?.trim() || undefined,
      title: values.title.trim(),
      ...(isEnterprise
        ? { creditCode: values.creditCode?.trim().toUpperCase() }
        : {}),
    }

    setSubmitting(true)
    try {
      await applyInvoice(request)
      saveCachedFormByType(invoiceType, {
        email: request.email,
        title: request.title,
        remark: request.remark,
        creditCode: request.creditCode,
      })
      form.resetFields(['amount', 'title', 'creditCode', 'remark'])
      await mutateAmountData()
      message.success('发票申请已提交，预计 72 小时内完成开具')
    } catch {
      // Error message is handled by global fetcher.
    } finally {
      setSubmitting(false)
    }
  }

  const isLoadingAmount = isLoading

  return (
    <ContentWrapper
      title="发票开具"
      icon={<FileTextOutlined />}
      description="支持企业发票与个人发票申请，提交后预计 72 小时内完成开具。"
      withSpace={false}
      info={error ? <Alert title="可开票金额加载失败，请稍后刷新页面重试。" type="error" /> : null}
    >
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {amountCards.map((item) => (
            <div
              key={item.label}
              className="bg-white px-4 py-3 shadow-sm"
            >
              <div className="mb-2 flex items-center gap-2 text-slate-500">
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="text-xl font-semibold text-slate-900">
                {isLoadingAmount ? <Skeleton.Input active size="small" /> : item.value}
              </div>
            </div>
          ))}
        </div>

        <section className="mt-4 bg-white p-4 shadow-sm sm:p-6">
          <Tabs
            activeKey={invoiceType}
            items={tabItems}
            onChange={handleTabChange}
          />
          {isLoadingAmount ? (
            <Skeleton active paragraph={{ rows: 10 }} />
          ) : (
            <Form<TInvoiceFormValues>
              form={form}
              layout="vertical"
              size="large"
              onFinish={handleSubmit}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="接收邮箱"
                    name="email"
                    rules={[
                      { required: true, message: '请输入电子发票接收邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined className="text-slate-400" />}
                      placeholder="请输入电子发票接收邮箱"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="发票类型">
                    <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3">
                      <Tag color="blue" className="m-0 border-none">
                        {INVOICE_CATEGORY_TEXT}
                      </Tag>
                    </div>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="开票金额"
                    name="amount"
                    rules={[
                      { required: true, message: '请输入开票金额' },
                      {
                        validator: (_, value: number | null) => {
                          if (value === null || value === undefined) {
                            return Promise.resolve()
                          }
                          if (value <= 0) {
                            return Promise.reject(
                              new Error('开票金额必须大于 0')
                            )
                          }
                          if (value > availableAmount) {
                            return Promise.reject(
                              new Error(
                                `开票金额不能超过 ${formatCurrency(availableAmount)}`
                              )
                            )
                          }
                          return Promise.resolve()
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0.01}
                      precision={2}
                      step={100}
                      controls={false}
                      placeholder={`最高可开票 ${formatCurrency(availableAmount)}`}
                    />
                  </Form.Item>
                </Col>

                {isEnterprise ? (
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="纳税人识别号"
                      name="creditCode"
                      rules={[
                        {
                          required: true,
                          message: '企业发票请填写纳税人识别号',
                        },
                        { len: 18, message: '纳税人识别号应为 18 位' },
                        {
                          pattern: /^[0-9A-Za-z]+$/,
                          message: '纳税人识别号仅支持数字与字母',
                        },
                      ]}
                    >
                      <Input placeholder="请输入纳税人识别号" maxLength={18} />
                    </Form.Item>
                  </Col>
                ) : (
                  <Col xs={24} md={12}>
                    <Form.Item label="备注" name="remark">
                      <Input.TextArea
                        placeholder="备注在发票上的内容（选填）"
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        maxLength={120}
                        showCount
                      />
                    </Form.Item>
                  </Col>
                )}

                <Col xs={24} md={isEnterprise ? 12 : 24}>
                  <Form.Item
                    label="发票抬头"
                    name="title"
                    rules={[{ required: true, message: '请输入发票抬头' }]}
                  >
                    <Input
                      prefix={<BankOutlined className="text-slate-400" />}
                      placeholder={
                        isEnterprise ? '请输入企业名称' : '请输入个人姓名'
                      }
                      maxLength={80}
                    />
                  </Form.Item>
                </Col>

                {isEnterprise && (
                  <Col xs={24} md={12}>
                    <Form.Item label="备注" name="remark">
                      <Input.TextArea
                        placeholder="备注在发票上的内容（选填）"
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        maxLength={120}
                        showCount
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>
              {availableAmount > 0 ? (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-blue-50 px-4 py-3">
                  <Typography.Text className="text-sm text-slate-600">
                    当前还可开票金额
                    <span className="mx-1 font-semibold text-blue-600">
                      {formatCurrency(availableAmount)}
                    </span>
                    ，预计 72 小时内完成开具。
                  </Typography.Text>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    disabled={availableAmount <= 0}
                  >
                    提交申请
                  </Button>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-red-50 px-4 py-3">
                  当前暂无可开票金额，可在订单支付后再提交发票申请。
                </div>
              )}
            </Form>
          )}
        </section>

        <section className="mt-4 bg-white p-4 shadow-sm sm:p-5">
          <h3 className="mb-3 text-base font-semibold text-slate-900">
            开票说明
          </h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-sm bg-slate-50 p-3">
              <p className="mb-1 text-sm font-medium text-slate-900">
                1. 电子发票
              </p>
              <p className="text-sm text-slate-600">
                电子发票将发送至填写的邮箱，请确认邮箱地址准确有效。
              </p>
            </div>
            <div className="rounded-sm bg-slate-50 p-3">
              <p className="mb-1 text-sm font-medium text-slate-900">
                2. 资料校验
              </p>
              <p className="text-sm text-slate-600">
                企业发票需填写纳税人识别号，个人发票仅需填写发票抬头。
              </p>
            </div>
            <div className="rounded-sm bg-slate-50 p-3">
              <p className="mb-1 text-sm font-medium text-slate-900">
                3. 开具时效
              </p>
              <p className="text-sm text-slate-600">
                申请提交后将由系统审核并开具，通常在 72 小时内完成。
              </p>
            </div>
          </div>
        </section>
    </ContentWrapper>
  )
}

export default Invoicing
