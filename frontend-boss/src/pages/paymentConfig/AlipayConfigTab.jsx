import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Switch,
  Button,
  message,
  Space,
  Typography,
  Divider,
  Alert,
} from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import { getAlipayConfig, saveAlipayConfig } from '../../services/paymentConfig'

const { TextArea } = Input
const { Text, Paragraph } = Typography

const AlipayConfigTab = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)

  const fetchConfig = async () => {
    setFetchLoading(true)
    try {
      const res = await getAlipayConfig()
      const config = res.data || {}
      form.setFieldsValue({
        appId: config.appId || '',
        privateKey: config.privateKey || '',
        publicKey: config.publicKey || '',
        aliPayPublicKey: config.aliPayPublicKey || '',
        notifyUrl: config.notifyUrl || '',
        returnUrl: config.returnUrl || '',
        enabled: config.enabled || false,
      })
    } catch (error) {
      message.error('获取支付宝配置失败')
    } finally {
      setFetchLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      const payload = {
        appId: values.appId,
        privateKey: values.privateKey,
        publicKey: values.publicKey,
        aliPayPublicKey: values.aliPayPublicKey,
        notifyUrl: values.notifyUrl,
        returnUrl: values.returnUrl,
        enabled: values.enabled,
      }
      await saveAlipayConfig(payload)
      message.success('支付宝配置保存成功')
    } catch (error) {
      if (error.errorFields) {
        return
      }
      message.error('保存失败: ' + (error.message || '未知错误'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    fetchConfig()
  }

  return (
    <div>
      <Alert
        message="配置说明"
        description={
          <div>
            <Paragraph>
              请在支付宝开放平台（open.alipay.com）获取以下信息：
            </Paragraph>
            <ul style={{ marginLeft: 20, lineHeight: 2 }}>
              <li>
                <Text strong>应用ID (APPID):</Text> 创建应用后获取
              </li>
              <li>
                <Text strong>商户私钥:</Text> 密钥工具生成，用于签名
              </li>
              <li>
                <Text strong>商户公钥:</Text> 密钥工具生成，上传至支付宝
              </li>
              <li>
                <Text strong>支付宝公钥:</Text> 上传商户公钥后，从支付宝获取，用于验签
              </li>
              <li>
                <Text strong>回调通知URL:</Text> 接收支付宝异步通知的地址
              </li>
              <li>
                <Text strong>支付成功跳转URL:</Text> 用户支付成功后跳转的页面地址
              </li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        initialValues={{ enabled: false }}
      >
        <Form.Item
          name="appId"
          label="应用ID (APPID)"
          rules={[
            { required: true, message: '请输入应用ID' },
            { pattern: /^\d{16}$/, message: '应用ID为16位数字' },
          ]}
        >
          <Input placeholder="请输入支付宝应用ID" maxLength={16} />
        </Form.Item>

        <Form.Item
          name="privateKey"
          label="商户私钥"
          rules={[
            { required: true, message: '请输入商户私钥' },
            { min: 100, message: '私钥长度不足' },
          ]}
        >
          <TextArea
            placeholder="请输入商户私钥（RSA2格式）"
            rows={6}
            showCount
            maxLength={2048}
          />
        </Form.Item>

        <Form.Item
          name="publicKey"
          label="商户公钥"
          rules={[
            { required: true, message: '请输入商户公钥' },
            { min: 100, message: '公钥长度不足' },
          ]}
        >
          <TextArea
            placeholder="请输入商户公钥（RSA2格式）"
            rows={6}
            showCount
            maxLength={2048}
          />
        </Form.Item>

        <Form.Item
          name="aliPayPublicKey"
          label="支付宝公钥"
          rules={[
            { required: true, message: '请输入支付宝公钥' },
            { min: 100, message: '公钥长度不足' },
          ]}
        >
          <TextArea
            placeholder="请输入支付宝公钥（用于验签）"
            rows={6}
            showCount
            maxLength={2048}
          />
        </Form.Item>

        <Form.Item
          name="notifyUrl"
          label="回调通知URL"
          rules={[
            { required: true, message: '请输入回调通知URL' },
            { type: 'url', message: '请输入有效的URL' },
          ]}
        >
          <Input placeholder="https://yourdomain.com/api/alipay/notify" />
        </Form.Item>

        <Form.Item
          name="returnUrl"
          label="支付成功跳转URL"
          rules={[
            { required: true, message: '请输入支付成功跳转URL' },
            { type: 'url', message: '请输入有效的URL' },
          ]}
        >
          <Input placeholder="https://yourdomain.com/payment-success" />
        </Form.Item>

        <Divider />

        <Form.Item
          name="enabled"
          label="启用支付"
          valuePropName="checked"
        >
          <Switch
            checkedChildren="已启用"
            unCheckedChildren="已禁用"
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
            >
              保存配置
            </Button>
            <Button onClick={handleReset}>
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  )
}

export default AlipayConfigTab
