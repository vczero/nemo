import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Space, message, Typography, Divider, Upload, Modal } from 'antd'
import { SaveOutlined, PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { getViewConfig, saveViewConfig, getPreviewUrl } from '../../services/viewConfig'

const { Title } = Typography

const ViewConfig = () => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form] = Form.useForm()
  const [menus, setMenus] = useState([])
  const [imageUrl, setImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewVisible, setPreviewVisible] = useState(false)

  const fetchConfig = async () => {
    setLoading(true)
    try {
      const res = await getViewConfig()
      form.setFieldsValue({
        bannerLink: res.banner?.link || '',
      })
      const ossPath = res.banner?.imageUrl || ''
      setImageUrl(ossPath)
      if (ossPath) {
        const previewRes = await getPreviewUrl(ossPath)
        setPreviewUrl(previewRes.data || '')
      } else {
        setPreviewUrl('')
      }
      setMenus(res.menus || [])
    } catch {
      message.error('获取视图配置失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchConfig() }, [])

  const handleUpload = async (file) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件')
      return false
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', 'SYSTEM_CONFIG')
      const response = await fetch('/boss/api/files/add', {
        method: 'POST',
        body: formData
      })
      const res = await response.json()
      if (res.success && res.value?.ossPath) {
        setImageUrl(res.value.ossPath)
        setPreviewUrl(res.value.url)
        message.success('上传成功')
      } else {
        message.error(res.message || '上传失败')
      }
    } catch {
      message.error('上传失败')
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      const config = {
        banner: { link: values.bannerLink || '', imageUrl: imageUrl },
        menus: menus.map(item => ({ name: item.name || '', link: item.link || '' }))
      }
      setSaving(true)
      await saveViewConfig(config)
      message.success('保存成功')
      fetchConfig()
    } catch {
      message.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMenu = () => setMenus([...menus, { name: '', link: '' }])
  const handleDeleteMenu = (index) => setMenus(menus.filter((_, i) => i !== index))
  const handleMenuChange = (index, field, value) => {
    const newMenus = [...menus]
    newMenus[index] = { ...newMenus[index], [field]: value }
    setMenus(newMenus)
  }

  return (
    <div className="view-config">
      <Card title="视图配置" extra={
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>保存</Button>
      } loading={loading}>

        <Title level={5} style={{ marginBottom: 8 }}>Banner</Title>
        <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="图片" style={{ marginBottom: 0, marginRight: 8 }}>
            <Upload accept="image/*" beforeUpload={handleUpload} showUploadList={false}>
              <Button icon={<UploadOutlined />} loading={uploading}>
                {imageUrl ? '更换图片' : '上传图片'}
              </Button>
            </Upload>
            {previewUrl && (
              <a onClick={() => setPreviewVisible(true)} style={{ marginLeft: 8 }}>预览图片</a>
            )}
          </Form.Item>
          <Form.Item name="bannerLink" label="链接" style={{ marginBottom: 0 }}>
            <Input placeholder="点击跳转地址" style={{ width: 300 }} />
          </Form.Item>
        </Form>

        <Divider style={{ margin: '12px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ marginBottom: 0 }}>导航菜单</Title>
          <Button size="small" icon={<PlusOutlined />} onClick={handleAddMenu}>添加</Button>
        </div>

        {menus.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '12px 0' }}>暂无菜单</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {menus.map((menu, index) => (
              <Space.Compact key={index} style={{ width: '100%' }}>
                <Input placeholder="菜单名称" value={menu.name} onChange={(e) => handleMenuChange(index, 'name', e.target.value)} style={{ width: '30%' }} />
                <Input placeholder="导航地址" value={menu.link} onChange={(e) => handleMenuChange(index, 'link', e.target.value)} />
                <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteMenu(index)} />
              </Space.Compact>
            ))}
          </div>
        )}
        <Modal open={previewVisible} footer={null} onCancel={() => setPreviewVisible(false)}>
          <img src={previewUrl} style={{ width: '100%' }} />
        </Modal>
      </Card>
    </div>
  )
}

export default ViewConfig
