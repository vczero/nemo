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
import type {
  TSentimentClassificationTaskParams,
  TInputFile,
  TTextClassificationCategory,
} from '@/apis/ml_task'
import { createAndDownloadTemplateFile, textContentToXLSX } from '../utils'
import FileAlert from '../components/FileAlert'

const { TextArea } = Input

interface ConfigStepsProps {
  config: {
    categories: TTextClassificationCategory[]
  }
  configLoading: boolean
  onSubmit: (params: {
    inputFiles?: TInputFile[]
    taskName?: string
    taskParams?: TSentimentClassificationTaskParams
  }) => Promise<string | null>
}

const SAMPLE_TEXT = `这家餐厅的菜品非常美味，服务态度也很好
今天天气不错，心情很愉快
这个产品质量太差了，用了一天就坏了
快递速度很快，包装也很好
电视剧晚上8点播出
公园里的风景很美，适合散步
客服态度恶劣，完全不解决问题
新买的手机性能很强，拍照效果出色
交通堵塞严重，上班迟到了
同事们都很友善，工作氛围很好`


export default function ConfigSteps({ onSubmit, config }: ConfigStepsProps) {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  // Data input
  const [textContent, setTextContent] = useState('')
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const [taskName, setTaskName] = useState<string>('')
  const [checkFileLoading, setCheckFileLoading] = useState(false)

  // Params
  // const [classificationMode, setClassificationMode] =
  //   useState<TSentimentClassificationMode>('SINGLE_CLASS')

  const handleInputFileSelect = useCallback(async (file: File) => {
    try {
      if (file.size > 50 * 1024 * 1024) {
        message.error('文件大小超过 50MB 限制。')
        return false
      }
      setCheckFileLoading(true)
      setTextContent('')

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
          categories: config?.categories ?? [],
          classificationType: 'SINGLE_CLASS',
        },
      })
    } catch (err) {
      message.error((err as Error).message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }, [localFile, textContent, taskName, onSubmit])

  const steps = [{ title: '填写或上传数据' }, { title: '执行结果' }]

  return (
    <div>
      <Steps current={0} items={steps} className="mb-8" />

      {/* <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <h3 className="mb-1 text-base font-bold">选择分类任务</h3>
        <p className="mb-3 text-sm text-gray-400">
          单分类是指一个文本属于一个类别；多分类是指一个文本可以属于 1 个或者多个类别
        </p>
        <Radio.Group
          value={classificationMode}
          onChange={(e) =>
            setClassificationMode(e.target.value as TSentimentClassificationMode)
          }
        >
          <Radio value="SINGLE_CLASS">单分类</Radio>
          <Radio value="MULTI_CLASS">多分类</Radio>
        </Radio.Group>
      </div> */}

      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <h3 className="mb-1 text-base font-bold">需要进行情感分类的文本</h3>
        <TextArea
          rows={6}
          placeholder="请输入需要分类的文本，每一行一篇文本；超过 10,000 字请上传文件。"
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
            <Button
              icon={<UploadOutlined />}
              type="primary"
              loading={checkFileLoading}
            >
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
              createAndDownloadTemplateFile('情感分类_数据模板.xlsx')
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

        <FileAlert keyword="文章内容" className="mt-2" />
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
          disabled={!localFileName && !textContent}
        >
          开始执行
        </Button>
      </div>
    </div>
  )
}
