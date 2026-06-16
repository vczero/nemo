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
import { getWechatConfig, saveWechatConfig } from '../../services/paymentConfig'

const { TextArea } = Input
const { Text, Paragraph } = Typography

const WechatConfigTab = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)

  const fetchConfig = async () => {
    setFetchLoading(true)
    try {
      const res = await getWechatConfig()
      const config = res.data || {}
      form.setFieldsValue({
        appId: config.appId || '',
        mchId: config.mchId || '',
        apiKey: config.apiKey || '',
        notifyUrl: config.notifyUrl || '',
        enabled: config.enabled || false,
      })
    } catch (error) {
      message.error('获取微信支付配置失败')
      form.setFieldsValue({
        appId: '',
        mchId: '',
        apiKey: '',
        notifyUrl: '',
        enabled: false,
      })
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
        mchId: values.mchId,
        apiKey: values.apiKey,
        notifyUrl: values.notifyUrl,
        enabled: values.enabled,
      }
      await saveWechatConfig(payload)
      message.success('微信支付配置保存成功')
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
              请在微信支付商户平台（pay.weixin.qq.com）获取以下信息：
            </Paragraph>
            <ul style={{ marginLeft: 20, lineHeight: 2 }}>
              <li>
                <Text strong>应用ID (APPID):</Text> 微信公众平台获取
              </li>
              <li>
                <Text strong>商户号 (MCHID):</Text> 微信支付商户平台获取
              </li>
              <li>
                <Text strong>API密钥:</Text> 商户平台设置，用于签名
              </li>
              <li>
                <Text strong>回调通知URL:</Text> 接收微信支付异步通知的地址
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
            { pattern: /^wx[a-z0-9]{16}$/, message: '应用ID格式不正确' },
          ]}
        >
          <Input placeholder="请输入微信应用ID (wx开头)" maxLength={18} />
        </Form.Item>

        <Form.Item
          name="mchId"
          label="商户号 (MCHID)"
          rules={[
            { required: true, message: '请输入商户号' },
            { pattern: /^\d{10,12}$/, message: '商户号为10-12位数字' },
          ]}
        >
          <Input placeholder="请输入微信支付商户号" maxLength={12} />
        </Form.Item>

        <Form.Item
          name="apiKey"
          label="API密钥"
          rules={[
            { required: true, message: '请输入API密钥' },
            { min: 32, message: 'API密钥长度不足' },
          ]}
        >
          <TextArea
            placeholder="请输入API密钥（32位字符）"
            rows={4}
            showCount
            maxLength={32}
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
          <Input placeholder="https://yourdomain.com/api/wechat/notify" />
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

export default WechatConfigTab
