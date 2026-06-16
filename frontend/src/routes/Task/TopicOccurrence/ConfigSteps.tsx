import { useState, useCallback } from 'react'
import { Steps, Input, Button, Upload, App } from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { parseFileToTable, validateTaskFile } from '@/utils/xlsx'
import { uploadFile } from '@/apis/func'
import { FILE_TYPE } from '@/constants/common'
import type { TTopicOccurrenceTaskParams, TInputFile } from '@/apis/ml_task'
import { createAndDownloadTemplateFile, textContentToXLSX } from '../utils'
import FileAlert from '../components/FileAlert'

const { TextArea } = Input

interface ConfigStepsProps {
  config: Record<string, unknown> | null
  configLoading: boolean
  onSubmit: (params: {
    inputFiles?: TInputFile[]
    taskName?: string
    taskParams?: TTopicOccurrenceTaskParams
  }) => Promise<string | null>
}

const SAMPLE_TEXT = `人工智能@机器学习@深度学习
大数据@云计算@人工智能
机器学习@自然语言处理@深度学习
云计算@大数据@物联网
人工智能@计算机视觉@深度学习
自然语言处理@机器学习@知识图谱
大数据@人工智能@智慧城市
物联网@云计算@智能制造
深度学习@计算机视觉@人工智能
知识图谱@自然语言处理@大数据`


export default function ConfigSteps({ onSubmit }: ConfigStepsProps) {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  // Data input
  const [textContent, setTextContent] = useState('')
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const [taskName, setTaskName] = useState<string>('')
  const [checkFileLoading, setCheckFileLoading] = useState(false)

  // Params
  const [delimiter, setDelimiter] = useState('@')

  const handleInputFileSelect = useCallback(async (file: File) => {
    try {
      if (file.size > 50 * 1024 * 1024) {
        message.error('文件大小超过 50MB 限制。')
        return false
      }
      setTextContent('')
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
    if (!localFile && !textContent.trim()) {
      message.warning('请输入文本或上传文件')
      return
    }

    if (!delimiter.trim()) {
      message.warning('请输入主题分隔符')
      return
    }

    setSubmitting(true)
    try {
      let fileToUpload = localFile
      if (!fileToUpload && textContent.trim()) {
        fileToUpload = textContentToXLSX(textContent)
      }

      if (!fileToUpload) {
        message.warning('请先上传数据')
        setSubmitting(false)
        return
      }

      const uploadRes = await uploadFile({
        file: fileToUpload,
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
          delimiter,
        },
      })
    } catch (err) {
      message.error((err as Error).message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }, [localFile, textContent, delimiter, taskName, onSubmit])

  const steps = [{ title: '填写或上传数据' }, { title: '执行结果' }]

  return (
    <div>
      <Steps current={0} items={steps} className="mb-8" />

      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-base font-bold">需要进行主题共现分析的文本</h3>
        <TextArea
          rows={6}
          placeholder="请输入需要进行主题共现分析的文本，每行一条记录，主题之间用分隔符分隔；不要超过 10,000 字；如果超过 10,000 字，建议上传文件。"
          value={textContent}
          onChange={(e) => {
            setTextContent(e.target.value)
            if (e.target.value.trim()) {
              setLocalFile(null)
              setLocalFileName(null)
            }
          }}
          maxLength={10000}
          showCount={true}
          disabled={!!localFile}
        />
        <div className="my-2 flex flex-wrap gap-3">
          <Upload
            beforeUpload={handleInputFileSelect}
            showUploadList={false}
            accept=".xlsx,.xls,.csv"
          >
            <Button icon={<UploadOutlined />} type="primary" loading={checkFileLoading}>
              上传文件
            </Button>
          </Upload>

          <Button
            icon={<FileTextOutlined />}
            type="default"
            onClick={() => setTextContent(SAMPLE_TEXT)}
            disabled={checkFileLoading || !!localFileName}
          >
            使用样例数据
          </Button>

          <Button
            icon={<DownloadOutlined />}
            type="default"
            onClick={() =>
              createAndDownloadTemplateFile('主题共现网络_数据模板.xlsx', [
                ['id', 'text'],
                [1, '人工智能@机器学习@深度学习'],
                [2, '大数据@云计算@人工智能'],
                [3, '机器学习@自然语言处理@深度学习'],
                [4, '云计算@大数据@物联网'],
              ])
            }
          >
            下载模板
          </Button>

          {localFileName && (
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <FileTextOutlined />
              {localFileName}
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
            </span>
          )}
        </div>
        <FileAlert keyword="主题文本" className="mt-2" />
      </div>

      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-base font-bold">
          主题分隔符 <span className="text-red-500">*</span>
        </h3>
        <Input
          placeholder="请输入主题之间的分隔符，例如 @、,、|"
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value)}
          maxLength={10}
          className="w-60"
        />
        <p className="mt-1 text-sm text-gray-400">
          分隔符用于分隔每条记录中的多个主题，默认为 @
        </p>
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
        <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={!localFileName && !textContent}>
          开始执行
        </Button>
      </div>
    </div>
  )
}
