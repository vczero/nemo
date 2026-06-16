import { useState, useEffect } from 'react'
import { Form, Input, Button, Checkbox, Skeleton, App } from 'antd'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import useSWR from 'swr'
import OTPInput from '@/components/OTPInput'
import { AGREEMENT_ENDPOINT } from '@/apis'
import { resetPassword, signIn, signUp } from '@/apis/func'
import type { TAgreementAPI } from '@/apis/types'
import { fetcher } from '@/utils/fetcher'
import { encryptData, passwordVerifier, getInviteCode, clearInviteCode } from '@/utils/utils'
import { VERIFY_CODE_TYPE } from '@/constants/common'

import logo from '@/assets/ywllogo_large.png';
import { useUser } from '@/contexts/UserContext'

interface ResetPasswordFormProps {
  onSwitch: () => void
}
const ResetPasswordForm = ({ onSwitch }: ResetPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const onFinish = async (values: any) => {
    try {
      setIsLoading(true)
      const resetPasswordData = {
        email: values.email,
        newPassword: encryptData(values.password),
        verifyCode: values.verifyCode
      }
      await resetPassword(resetPasswordData)
      message.success('密码重置成功')
      onSwitch()
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-w-[300px]">
      <div className="mb-8 text-center">
        <div className="mt-2 text-sm text-gray-500 select-none">
          还没有账号吗？{' '}
          <span
            onClick={onSwitch}
            className="cursor-pointer text-blue-600 hover:underline"
          >
            立即注册
          </span>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>

        <Form.Item
          name="email"
          rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
        >
          <Input placeholder="请填写电子邮箱" />
        </Form.Item>

        <Form.Item
          name="verifyCode"
          rules={[{ required: true, message: '请输入 6 位验证码' }]}
        >
          <OTPInput type={VERIFY_CODE_TYPE.RESET_PASSWORD} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[passwordVerifier]}
        >
          <Input.Password placeholder="请填写新的密码" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          dependencies={['password']}
          hasFeedback
          rules={[
            {
              required: true,
              message: '请确认登录密码',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password placeholder='请确认密码' autoComplete="new-password" />
        </Form.Item>

        <div className="mb-6 flex justify-end">
          <Link to="/signin" className="text-sm text-blue-600">
            去登录
          </Link>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="h-12 w-full rounded-lg bg-blue-600"
            loading={isLoading}
          >
            重置密码
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}


interface SignInFormProps {
  onSwitch: () => void
}

const SignInForm: React.FC<SignInFormProps> = ({ onSwitch }) => {
  const navigate = useNavigate()
  const { mutateUserData, mutateAccountSubscriptionData } = useUser()
  const { data: agreement, isLoading: isAgreementLoading } = useSWR<TAgreementAPI>(AGREEMENT_ENDPOINT, fetcher)
  const [isLoading, setIsLoading] = useState(false)
  const [form] = Form.useForm()

  const onFinish = async (values: any) => {
    try {
      setIsLoading(true)
      const signinData = {
        password: encryptData(values.password),
        username: values.username,
        agreementIds: agreement?.map((item) => item.agreementId) || []
      }
      await signIn(signinData)
      setIsLoading(false)

      try {
        await Promise.all([mutateUserData(), mutateAccountSubscriptionData()])
        navigate('/apps/center', { replace: true })
      } catch (error) {
        console.error(error)
        location.replace('/apps/center')
      }
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-w-[300px]">
      <div className="mb-8 text-center">
        <div className="mt-2 text-sm text-gray-500 select-none">
          还没有账号吗？{' '}
          <span
            onClick={onSwitch}
            className="cursor-pointer text-blue-600 hover:underline"
          >
            立即注册
          </span>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="username"
          rules={[{ required: true, type: 'email', message: '请输入邮箱' }]}
        >
          <Input
            autoComplete="username"
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="请输入您的邮箱"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input.Password
            autoComplete="current-password"
            prefix={<LockOutlined className="text-gray-400" />}
            placeholder="请输入登录密码"
          />
        </Form.Item>

        <Form.Item
          name="agree"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject('请阅读并同意条款'),
            },
          ]}
        >
          <Checkbox>
            我已阅读并同意
            {agreement && agreement.map((item, idx) => {
              return <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                {'  '}{item.title}
              </a>
            })
            }
          </Checkbox>
        </Form.Item>

        <div className="mb-6 flex justify-between">
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>记住密码</Checkbox>
          </Form.Item>
          <Link to="/reset-password" className="text-sm text-blue-600">
            忘记密码？
          </Link>
        </div>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="h-12 w-full rounded-lg bg-blue-600"
            loading={isLoading || isAgreementLoading}
          >
            登 录
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

interface SignUpFormProps {
  onSwitch: () => void
}


const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitch }) => {
  const { message } = App.useApp()
  const { data: agreement, isLoading: isAgreementLoading } = useSWR<TAgreementAPI>(AGREEMENT_ENDPOINT, fetcher)
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const savedInviteCode = getInviteCode()
    if (savedInviteCode) {
      form.setFieldsValue({ inviteCode: savedInviteCode })
    }
  }, [form])

  const onFinish = async (values: any) => {
    try {
      setIsLoading(true)
      const registerData = { ...values }
      registerData.password = encryptData(registerData.password)
      delete registerData.confirm
      delete registerData.agree
      registerData.agreementIds = agreement?.map((item) => item.agreementId)
      await signUp(registerData)
      clearInviteCode()
      message.success('注册成功')
      onSwitch()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full min-w-[300px]">
      {/* 头部标题部分 */}
      <div className="mb-8 text-center">
        <div className="mt-2 text-sm text-gray-500 select-none">
          已经有账号？{' '}
          <span
            onClick={onSwitch}
            className="cursor-pointer text-blue-600 hover:underline"
          >
            去登录
          </span>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="nickname">
          <Input placeholder="用户昵称, 不填写则默认生成" maxLength={10} showCount />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
        >
          <Input placeholder="请填写电子邮箱，教育邮箱享受折扣" />
        </Form.Item>

        <Form.Item
          name="verifyCode"
          rules={[{ required: true, message: '请输入 6 位验证码' }]}
        >
          <OTPInput type={VERIFY_CODE_TYPE.REGISTER} />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[passwordVerifier]}
        >
          <Input.Password placeholder="请填写登录密码" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirm"
          dependencies={['password']}
          hasFeedback
          rules={[
            {
              required: true,
              message: '请确认登录密码',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password placeholder='请确认登录密码' autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="inviteCode">
          <Input placeholder="如有邀请码, 享受折扣" />
        </Form.Item>

        <Form.Item
          name="agree"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value ? Promise.resolve() : Promise.reject('请阅读并同意条款'),
            },
          ]}
        >
          <Checkbox>
            我已阅读并同意
            {agreement && agreement.map((item, idx) => {
              return <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                {'  '}{item.title}
              </a>
            })
            }
          </Checkbox>
        </Form.Item>

        <Form.Item className="mt-8">
          <Button
            type="primary"
            htmlType="submit"
            className="h-12 w-full rounded-lg bg-blue-600 text-lg font-medium"
            disabled={isLoading || isAgreementLoading}
          >
            提交注册
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default function AuthPage() {
  const {loading, user } = useUser()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (user) {
    return <Navigate to="/apps/charts" replace />;
  }

  return (
    <div className="w-full h-screen min-h-[800px] bg-[#F4F7FF] items-center relative">
      <div className="m-auto flex w-1/2 items-center justify-center p-6 sm:p-12 lg:w-1/2">
        <div className="w-[480px]">
          <div className="flex items-center justify-center shrink-0 cursor-pointer w-full h-full py-2 gap-2" onClick={() => navigate('/')}>
            <img src={logo} alt="Nemo" className="size-12 object-contain" />
            <div className="flex flex-col">
              <h1 className="text-xl font-bold">Nemo数据分析</h1>
              <p className="text-sm text-gray-500">数据挖掘与可视化智能体</p>
            </div>
          </div>
          {
            loading ? (
              <Form layout="vertical" className="mt-[52px]">
                <Form.Item>
                  <Skeleton.Input active block />
                </Form.Item>
                <Form.Item>
                  <Skeleton.Input active block />
                </Form.Item>
                <Form.Item>
                  <Skeleton.Button active block />
                </Form.Item>
              </Form>
            ) : (
              pathname === '/signin' ? (
                <SignInForm onSwitch={() => {
                  navigate('/signup', { replace: true })
                }} />
              ) : pathname === '/signup' ? (
                <SignUpForm onSwitch={() => {
                  navigate('/signin', { replace: true })
                }} />
              ) : (
                <ResetPasswordForm onSwitch={() => {
                  navigate('/signin', { replace: true })
                }} />
              )
            )
          }
        </div>
      </div>
      <div className="absolute bottom-6 w-full text-center text-xs text-gray-400  bg-[#F4F7FF]">
        Nemo 数据分析 © 2024 Created by Nemo Team
      </div>
    </div>
  )
}
