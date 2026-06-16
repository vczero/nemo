import React from 'react'
import { Tabs } from 'antd'
import { AlipayOutlined, WechatOutlined } from '@ant-design/icons'
import AlipayConfigTab from './AlipayConfigTab'
import WechatConfigTab from './WechatConfigTab'

const { TabPane } = Tabs

const PaymentConfigManagement = () => {
  return (
    <Tabs
      defaultActiveKey="alipay"
      size="large"
      style={{
        minHeight: 500,
      }}
    >
      <TabPane
        tab={
          <span>
            <AlipayOutlined style={{ color: '#1677ff' }} />
            支付宝配置
          </span>
        }
        key="alipay"
      >
        <AlipayConfigTab />
      </TabPane>
      <TabPane
        tab={
          <span>
            <WechatOutlined style={{ color: '#52c41a' }} />
            微信支付配置
          </span>
        }
        key="wechat"
      >
        <WechatConfigTab />
      </TabPane>
    </Tabs>
  )
}

export default PaymentConfigManagement
