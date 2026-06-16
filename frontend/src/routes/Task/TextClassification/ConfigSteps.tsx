import { useState, useCallback } from 'react'
import { Steps, Input, Radio, Button, Upload, App } from 'antd'
import {
  UploadOutlined,
  DownloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { parseFileToTable, validateTaskFile } from '@/utils/xlsx'
import { uploadFile } from '@/apis/func'
import { FILE_TYPE } from '@/constants/common'
import type {
  TTextClassificationTaskParams,
  TTextClassificationMode,
  TTextClassificationCategory,
  TInputFile,
} from '@/apis/ml_task'
import { createAndDownloadTemplateFile } from '../utils'
import FileAlert from '../components/FileAlert'

interface ConfigStepsProps {
  config: Record<string, unknown> | null
  configLoading: boolean
  onSubmit: (params: {
    inputFiles?: TInputFile[]
    taskName?: string
    taskParams?: TTextClassificationTaskParams
  }) => Promise<string | null>
}

const DEFAULT_CATEGORIES: TTextClassificationCategory[] = [
  {
    category: '账号问题',
    description: '包含账号到期、登录、注册、密码等',
  },
  {
    category: '支付问题',
    description: '包含订单咨询、退款、支付等',
  },
  {
    category: '物流问题',
    description: '包含物流发货、地址、收货等',
  },
  { category: '', description: '' },
]

const MAX_CATEGORIES = 20

export default function ConfigSteps({ onSubmit }: ConfigStepsProps) {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  const [localFile, setLocalFile] = useState<File | null>(null)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const [taskName, setTaskName] = useState<string>('')
  const [checkFileLoading, setCheckFileLoading] = useState(false)

  const [classificationMode, setClassificationMode] =
    useState<TTextClassificationMode>('SINGLE_CLASS')
  const [categories, setCategories] =
    useState<TTextClassificationCategory[]>(DEFAULT_CATEGORIES)

  const updateCategory = (
    index: number,
    field: keyof TTextClassificationCategory,
    value: string
  ) => {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    )
  }

  const addCategory = () => {
    if (categories.length >= MAX_CATEGORIES) {
      return
    }
    setCategories((prev) => [...prev, { category: '', description: '' }])
  }

  const removeCategory = (index: number) => {
    setCategories((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length === 0 ? [{ category: '', description: '' }] : next
    })
  }

  const handleInputFileSelect = useCallback(async (file: File) => {
    try {
      if (file.size > 50 * 1024 * 1024) {
        message.error('文件大小超过 50MB 限制。')
        return false
      }
      setCheckFileLoading(true)

      if (file.size < 20 * 1024 * 1024) {
        const table = await parseFileToTable(file)
        const validation = validateTaskFile(table)
        if (!validation.valid) {
          message.error(validation.error)
          setCheckFileLoading(false)
          return false
        }
      }

      setLocalFile(file)
      setLocalFileName(file.name)
    } catch (err) {
      message.error((err as Error).message || '文件解析失败')
    }
    setCheckFileLoading(false)
    return false
  }, [])

  const handleSubmit = useCallback(async () => {
    const validCategories = categories
      .map((c) => ({
        category: c.category.trim(),
        description: c.description.trim(),
      }))
      .filter((c) => c.category.length > 0)

    if (validCategories.length < 2) {
      message.warning('请至少填写 2 个分类标签')
      return
    }

    const names = validCategories.map((c) => c.category)
    if (new Set(names).size !== names.length) {
      message.warning('分类标签名称不能重复')
      return
    }

    if (!localFile) {
      message.warning('请上传需要分类的文本文件')
      return
    }

    setSubmitting(true)
    try {
      const uploadRes = await uploadFile({
        file: localFile,
        fileType: FILE_TYPE.COMPUTE_INPUT,
      })

      await onSubmit({
        inputFiles: [
          {
            id: uploadRes.fileId,
            name: 'user_data_oss_path',
            path: uploadRes.ossPath,
          },
        ],
        taskName: taskName.trim(),
        taskParams: {
          classificationType: classificationMode,
          categories: validCategories,
        },
      })
    } catch (err) {
      message.error((err as Error).message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }, [localFile, categories, classificationMode, taskName, onSubmit])

  const steps = [{ title: '填写或上传数据' }, { title: '执行结果' }]

  return (
    <div>
      <Steps current={0} items={steps} className="mb-8" />
      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">请输入需要分类的标签和解释</h3>
          <Button
            type="default"
            icon={<PlusOutlined />}
            onClick={addCategory}
            disabled={categories.length >= MAX_CATEGORIES}
          >
            增加一个类别
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {categories.map((category, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-sm font-medium text-gray-700">
                类别{index + 1}
              </span>
              <Input
                className="w-48! shrink-0"
                placeholder="请输入分类标签名称"
                value={category.category}
                onChange={(e) =>
                  updateCategory(index, 'category', e.target.value)
                }
                maxLength={100}
              />
              <Input
                placeholder="请输入分类相关的关键词和描述。"
                value={category.description}
                onChange={(e) =>
                  updateCategory(index, 'description', e.target.value)
                }
              />
              <Button
                type="text"
                icon={<DeleteOutlined />}
                onClick={() => removeCategory(index)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <h3 className="mb-1 text-base font-bold">选择分类任务</h3>
        <p className="mb-3 text-sm text-gray-400">
          单分类是指一个文本属于一个类别；多分类是指一个文本可以属于 1
          个或者多个类别
        </p>
        <Radio.Group
          value={classificationMode}
          onChange={(e) =>
            setClassificationMode(e.target.value as TTextClassificationMode)
          }
        >
          <Radio value="SINGLE_CLASS">单分类</Radio>
          <Radio value="MULTI_CLASS">多分类</Radio>
        </Radio.Group>
      </div>

      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">上传需要分类的文本</h3>
          <Button
            type="default"
            icon={<DownloadOutlined />}
            onClick={() =>
              createAndDownloadTemplateFile('文本分类_数据模板.xlsx')
            }
          >
            下载示例文本
          </Button>
        </div>
        <Upload.Dragger
          beforeUpload={handleInputFileSelect}
          showUploadList={false}
          accept=".xlsx,.xls,.csv"
          disabled={checkFileLoading}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">
            {localFileName
              ? localFileName
              : '上传 Excel 文件，最大不超过 50,000 行'}
          </p>
        </Upload.Dragger>
        {localFileName && (
          <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
            <FileTextOutlined />
            <span>{localFileName}</span>
            <Button
              type="link"
              size="small"
              onClick={() => {
                setLocalFile(null)
                setLocalFileName(null)
              }}
            >
              移除
            </Button>
          </div>
        )}
        <FileAlert keyword="待分类文本" className="mt-2" />
      </div>

      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <div className="mb-3 text-base font-bold">任务名称</div>
        <Input
          placeholder="请输入任务名称"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          maxLength={200}
          showCount={true}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!localFileName}
        >
          开始执行
        </Button>
      </div>
    </div>
  )
}
