import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  Modal,
  Skeleton,
  Space,
  type GetProp,
  App,
  Alert,
} from 'antd'
import {
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { UploadProps } from 'antd/es/upload/interface'

import useDebounceCallback from '@/hooks/useDebounceCallback'
import { useUser } from '@/contexts/UserContext'

import type { User } from '@/types'
import OTPInput from '@/components/OTPInput'
import { VERIFY_CODE_TYPE } from '@/constants/common'
import { updateUser, updatePassword, updateUserEmail } from '@/apis/func'

import { encryptData, passwordVerifier } from '@/utils/utils'
import { updateUserAvatar } from '@/apis'
import { useNavigate } from 'react-router'
import { logout } from '@/apis/func'
import ContentWrapper from '@/components/ContentWrapper'

type FileType = Parameters<NonNullable<GetProp<UploadProps, 'beforeUpload'>>>[0]

const UserProfile: React.FC = () => {
  const { user, loading, mutateUserData, error } = useUser()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [emailForm] = Form.useForm()

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [loadingAvatar, setLoadingAvatar] = useState(false)

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        email: user.email,
        nickname: user.nickname,
        organization: user.organization,
      })
    }
  }, [user, profileForm])

  const updateProfile = async (changedValues: Partial<User>) => {
    try {
      await updateUser(changedValues)
      mutateUserData({ ...user, ...changedValues })
      message.success('保存成功')
    } catch (error) {
      console.error(error)
    }
  }

  const debouncedUpdateProfile = useDebounceCallback(updateProfile, 800)

  const handleUpdateEmail = async () => {
    try {
      setLoadingEmail(true)
      const values = await emailForm.validateFields()
      console.log('提交修改邮箱:', values)

      await updateUserEmail({
        newEmail: values.email,
        verifyCode: values.verifyCode,
      })
      await mutateUserData()

      message.success('邮箱修改成功')
      setIsEmailModalOpen(false)
      emailForm.resetFields()
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingEmail(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      setLoadingPassword(true)
      const values = await passwordForm.validateFields()

      const encryptedPasswords = {
        oldPassword: encryptData(values.oldPassword),
        newPassword: encryptData(values.newPassword),
      }
      await updatePassword(encryptedPasswords)
      message.success('密码修改成功')
      setIsPasswordModalOpen(false)
      passwordForm.resetFields()
      await logout()
      mutateUserData(undefined, false)
      navigate('/signin')
    } catch (info) {
      console.log('更改密码失败, 请稍后重试')
    } finally {
      setLoadingPassword(false)
    }
  }

  const handleAvatarChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      setLoadingAvatar(true)
      return
    }
    if (info.file.status === 'done') {
      setLoadingAvatar(false)
      mutateUserData()
      message.success('头像上传成功')
    }
  }

  const beforeUpload = (file: FileType) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 文件!')
    }
    const isLt2M = file.size / 1024 / 1024 < 1
    if (!isLt2M) {
      message.error('图片大小不能超过1MB!')
    }
    return isJpgOrPng && isLt2M
  }

  const uploadAvatar = async (opts: Parameters<NonNullable<UploadProps['customRequest']>>[0]) => {
    try {
      await updateUserAvatar({ file: opts.file as File })
      opts.onSuccess?.(opts.file)
    } catch (error) {
      opts.onError?.(error as Error)
    }
  }

  return (
    <ContentWrapper title="用户信息" icon={<UserOutlined />} info={error ? <Alert title="用户信息加载失败，请稍后重试。" type="error" /> : null}>
      {loading ? (
        <Skeleton active />
      ) : ( <div className="">
          <Form
            form={profileForm}
            layout="vertical"
            labelCol={{ span: 5 }}
            wrapperCol={{ span: 19 }}
            size="middle"
            onValuesChange={debouncedUpdateProfile}
            className="max-w-xl"
          >
            <div className="mb-8 flex items-center gap-6">
              <Avatar
                size={100}
                src={user?.avatarUrl}
                icon={<UserOutlined />}
                className="bg-gray-200"
              />
              <div className="flex flex-col gap-2">
                <Upload
                  showUploadList={false}
                  accept=".jpg,.png,.jpeg"
                  beforeUpload={beforeUpload}
                  customRequest={uploadAvatar}
                  onChange={handleAvatarChange}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={loadingAvatar}
                  >
                    更换头像
                  </Button>
                </Upload>
                <span className="text-xs text-gray-400">
                  支持 JPG, PNG 格式，最大 1MB
                </span>
              </div>
            </div>
            <Form.Item label="邮箱" name="email">
              <Space.Compact className='w-full'>
                <Input
                  value={user?.email}
                  disabled
                  style={{ color: 'rgba(0, 0, 0, 0.65)', cursor: 'default' }}
                />
                <Button onClick={() => setIsEmailModalOpen(true)}>修改</Button>
              </Space.Compact>
            </Form.Item>

            <Form.Item label="昵称" name="nickname">
              <Input placeholder="请输入昵称" maxLength={20} showCount />
            </Form.Item>

            <Form.Item label="机构/学校" name="organization">
              <Input
                placeholder="请输入机构或学校名称"
                maxLength={30}
                showCount
              />
            </Form.Item>
            <Form.Item label="密码">
              <Button onClick={() => setIsPasswordModalOpen(true)}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}

      <Modal
        title="修改绑定邮箱"
        open={isEmailModalOpen}
        onOk={handleUpdateEmail}
        confirmLoading={loadingEmail}
        onCancel={() => setIsEmailModalOpen(false)}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={emailForm} layout="vertical" preserve={false}>
          <Form.Item
            name="email"
            className="mb-2"
            rules={[
              { required: true, message: '请输入新邮箱' },
              { type: 'email', message: '请输入有效的邮箱格式' },
            ]}
          >
            <Input placeholder="请输入新邮箱" />
          </Form.Item>
          <Form.Item
            name="verifyCode"
            className="mb-2"
            rules={[{ required: true, message: '请输入 6 位验证码' }]}
          >
            <OTPInput type={VERIFY_CODE_TYPE.UPDATE_EMAIL} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="修改密码"
        open={isPasswordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => {
          setIsPasswordModalOpen(false)
          passwordForm.resetFields()
        }}
        confirmLoading={loadingPassword}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={passwordForm} layout="vertical" preserve={false}>
          <Form.Item
            name="oldPassword"
            label="旧密码"
            className="mb-2"
            rules={[{ required: true, message: '请输入旧密码' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="新密码"
            className="mb-2"
            rules={[
              { required: true, message: '请输入新密码' },
              passwordVerifier,
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="重复新密码"
            className="mb-2"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请重复新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </ContentWrapper>
  )
}

export default UserProfile
