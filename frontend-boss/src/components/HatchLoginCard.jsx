import React, { useState, useEffect } from 'react'
import { Form, Input, Button, message, Tabs } from 'antd'
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/user'
import './HatchLogin.css'

const HatchLoginCard = () => {
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState('password')
  const [isOpening, setIsOpening] = useState(false)
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const onFinish = async values => {
    setLoading(true)
    try {
      const res = await login(values)
      if (res.code === 0) {
        localStorage.setItem('token', res.data.userId)
        localStorage.setItem('user', JSON.stringify(res.data))
        message.success('登录成功')
        setIsOpening(true)

        setTimeout(() => {
          navigate('/')
        }, 1500)
      }
    } catch (error) {
      message.error(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const generateRivets = () => {
    const rivets = []
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2
      const radius = 242
      const x = 250 + radius * Math.cos(angle) - 5
      const y = 250 + radius * Math.sin(angle) - 5
      rivets.push(
        <div
          key={i}
          className="rivet"
          style={{ left: `${x}px`, top: `${y}px` }}
        />
      )
    }
    return rivets
  }

  return (
    <div className={`hatch ${isOpening ? 'open' : ''}`}>
      <div className="hologram-ring"></div>
      <div className="rivets-container">{generateRivets()}</div>

      <h1 className="nautilus-title">NAUTILUS</h1>
      <p className="hatch-subtitle">鹦鹉螺号</p>

      <Form form={form} name="login" onFinish={onFinish} autoComplete="off">
        <Form.Item
          name="username"
          className="input-group"
          rules={[
            { required: true, message: '请输入用户名或邮箱' },
            { type: 'string', min: 2, message: '用户名或邮箱至少2个字符' },
          ]}
        >
          <Input
            id="username"
            placeholder="USERNAME / EMAIL"
            prefix={<UserOutlined />}
            size="large"
            autoComplete="off"
          />
        </Form.Item>
        {loginType === 'password' ? (
          <Form.Item name="password" className="input-group">
            <Input.Password
              id="password"
              placeholder="ACCESS CODE"
              prefix={<LockOutlined />}
              size="large"
            />
          </Form.Item>
        ) : (
          <Form.Item name="verifyCode" className="input-group">
            <Input
              id="verifyCode"
              placeholder="VERIFICATION CODE"
              prefix={<SafetyOutlined />}
              size="large"
            />
          </Form.Item>
        )}

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={loading}
          className="hatch-login-btn"
        >
          下潜 / INITIATE
        </Button>
      </Form>

      <p className="nemo-quote">
        "在那里，我不再受人约束。那是自由之境。" —— 尼摩船长
      </p>

      <div className="status-dots">
        <div className="status-dot"></div>
        <div className="status-dot" style={{ animationDelay: '0.4s' }}></div>
        <div className="status-dot" style={{ animationDelay: '0.8s' }}></div>
      </div>
    </div>
  )
}

export default HatchLoginCard
