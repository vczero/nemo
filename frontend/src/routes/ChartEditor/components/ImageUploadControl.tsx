import { Upload, App, Button, Form } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import React, { useState } from 'react'

import { dataURLtoFile } from '@/utils/utils'

interface ImageUploadControlProps {
  value?: string // Base64 string
  onChange?: (value?: string) => void
  accept?: string
  tooltip?: string
}

const ImageUploadControl: React.FC<ImageUploadControlProps> = ({
  value,
  onChange,
  accept = 'image/*',
  tooltip,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const { message } = App.useApp()
  React.useEffect(() => {
    if (value) {
      const file = dataURLtoFile(value)
      ;(file as any).thumbUrl = value
      setFileList([file as unknown as UploadFile])
    } else {
      setFileList([])
    }
  }, [value])

  const getBase64 = (
    img: File,
    callback: (result: string | ArrayBuffer | null) => void
  ) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => callback(reader.result))
    reader.readAsDataURL(img)
  }

  const beforeUpload = (file: File) => {
    const isJpgOrPng =
      file.type === 'image/jpeg' ||
      file.type === 'image/svg+xml'
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/SVG file!')
    }
    const isLt2M = file.size / 1024 / 1024 < 1
    if (!isLt2M) {
      message.error('Image must smaller than 1MB!')
    }
    return isJpgOrPng && isLt2M
  }

  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'done') {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj as File, (imageUrl) => {
        onChange?.(imageUrl as string) // Pass base64 string
      })
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`)
      onChange?.(undefined)
    } else if (info.file.status === 'removed') {
      onChange?.(undefined)
    }
    setFileList(info.fileList)
  }

  const customRequest = async (options: any) => {
    // We don't really upload to a server, just read locally
    options.onSuccess(null, options.file)
  }

  return (
    <Upload
      listType="picture"
      maxCount={1}
      fileList={fileList}
      beforeUpload={beforeUpload}
      onChange={handleChange}
      customRequest={customRequest}
      accept={accept}
    >
      <Button icon={<UploadOutlined />}>上传图片</Button>
    </Upload>
  )
}

export default ImageUploadControl
