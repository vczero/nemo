import { useState, useCallback } from 'react'
import { Steps, Input, InputNumber, Button, Upload, App } from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { parseFileToTable, validateTaskFile } from '@/utils/xlsx'
import { uploadFile } from '@/apis/func'
import { FILE_TYPE } from '@/constants/common'
import type { TCoOccurrenceTaskParams, TInputFile } from '@/apis/ml_task'
import FileAlert from '../components/FileAlert'
import { createAndDownloadTemplateFile, textContentToXLSX } from '../utils'

const { TextArea } = Input

interface ConfigStepsProps {
  config: Record<string, unknown> | null
  configLoading: boolean
  onSubmit: (params: {
    inputFiles?: TInputFile[]
    taskName?: string
    taskParams?: TCoOccurrenceTaskParams
  }) => Promise<string | null>
}

const SAMPLE_TEXT = `人工智能技术在医疗领域的应用越来越广泛
大数据分析助力金融风控体系建设
云计算与大数据技术推动产业升级
深度学习是机器学习的重要分支
智能制造引领制造业数字化转型
人工智能与教育融合创新发展
机器学习算法在风控领域表现突出
大数据技术助力智慧城市建设
云计算平台为人工智能提供算力支撑
产业升级需要智能制造技术支持`

export default function ConfigSteps({ onSubmit }: ConfigStepsProps) {
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  // Data input
  const [textContent, setTextContent] = useState('')
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const [checkFileLoading, setCheckFileLoading] = useState(false)
  const [taskName, setTaskName] = useState<string>('')
  // Params
  const [minFrequency, setMinFrequency] = useState(1)
  const [topN, setTopN] = useState(500)

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
          min_frequency: minFrequency,
          top_n: topN,
        },
      })
    } catch (err) {
      message.error((err as Error).message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }, [localFile, textContent, minFrequency, topN, taskName, onSubmit])

  const steps = [{ title: '填写或上传数据' }, { title: '执行结果' }]

  return (
    <div>
      <Steps current={0} items={steps} className="mb-8" />

      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <h3 className="mb-2 text-base font-bold">需要进行语义共现分析的文本</h3>
        <TextArea
          rows={6}
          placeholder="请输入需要进行语义共现分析的文本，每一行一篇文章；不要超过10000字；如果超过10000字，建议上传文件。"
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
            onClick={() => createAndDownloadTemplateFile('语义共现网络_数据模板.xlsx')}
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
        <h3 className="mb-2 text-base font-bold">最小共现频次过滤</h3>
        <div className="flex items-center gap-2">
          <span>保留词频大于</span>
          <InputNumber
            min={1}
            max={100}
            value={minFrequency}
            onChange={(v) => setMinFrequency(v ?? 1)}
          />
          <span>的词对，默认为1</span>
        </div>

        <h3 className="mt-6 mb-2 text-base font-bold">返回前N个高频共现词对</h3>
        <div className="flex items-center gap-2">
          <span>保留最多</span>
          <InputNumber
            min={1}
            max={1000}
            value={topN}
            onChange={(v) => setTopN(v ?? 500)}
          />
          <span>个词对，默认为500，最大为1000</span>
        </div>
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
