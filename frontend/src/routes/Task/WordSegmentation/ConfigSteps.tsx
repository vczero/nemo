import { useState, useCallback } from 'react'
import { Steps, Input, Button, Upload, Checkbox, Radio, App, Result } from 'antd'
import {
  UploadOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { parseFileToTable, validateTaskFile } from '@/utils/xlsx'
import { uploadFile } from '@/apis/func'
import { FILE_TYPE } from '@/constants/common'
import type {
  TWordSegmentationTaskConfigResponse,
  TWordSegmentationTaskParams,
  TInputFile,
} from '@/apis/ml_task'
import type { TUploadFileResponse } from '@/apis/types'
import { createAndDownloadTemplateFile, textContentToXLSX } from '../utils'
import FileAlert from '../components/FileAlert'

const { TextArea } = Input

interface ConfigStepsProps {
  config: TWordSegmentationTaskConfigResponse | null
  configLoading: boolean
  onSubmit: (params: {
    inputFiles?: TInputFile[]
    taskName?: string
    taskParams?: TWordSegmentationTaskParams
  }) => Promise<string | null>
}

const TEST_TXT = `今天是星期一
明天是星期二
后天是星期三
我是中国人
我来自中国
这里是北京
这里是上海
`

export default function ConfigSteps({ config, onSubmit }: ConfigStepsProps) {
  const { message } = App.useApp()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Data input — keep data locally, upload at submit
  const [textContent, setTextContent] = useState('')
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const [checkFileLoading, setCheckFileLoading] = useState(false)
  // Step 2: Config
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([])
  const [customStopwords, setCustomStopwords] = useState('')
  const [stopwordsFile, setStopwordsFile] = useState<File | null>(null)
  const [stopwordsFileName, setStopwordsFileName] = useState<string | null>(
    null
  )
  const [model, setModel] = useState<string>()
  const [taskName, setTaskName] = useState<string>('')

  // Derived from config
  const stopwordLibraries = config?.user_selected_stopword_names ?? []

  const models = config?.seg_model ?? []

  // ── Step 1: Validate & store file locally ──
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

  // ── Step 2: Custom stopwords file ──
  const handleStopwordsFileSelect = useCallback(async (file: File) => {
    try {
      if (file.size > 5 * 1024 * 1024) {
        message.error('文件大小超过 5MB 限制。')
        return false
      }
      setCustomStopwords('')
      setCheckFileLoading(true)
      const table = await parseFileToTable(file)
      const validation = validateTaskFile(table)
      if (!validation.valid) {
        message.error(validation.error)
        setCheckFileLoading(false)
        return false
      }
      setStopwordsFile(file)
      setStopwordsFileName(file.name)
    } catch (err) {
      message.error((err as Error).message || '文件解析失败')
    }
    setCheckFileLoading(false)
    return false
  }, [])

  // ── Step 1 → 2 ──
  const handleNextStep = useCallback(() => {
    if (!localFile && !textContent.trim()) {
      message.warning('请输入文本或上传文件')
      return
    }
    setCurrentStep(1)
  }, [localFile, textContent])

  // ── Final submit: build file (if needed) → upload → submit task ──
  const handleSubmit = useCallback(async () => {
    if (!localFile && !textContent.trim()) {
      message.warning('请先上传数据')
      return
    }

    if (selectedLibraries.length === 0) {
      message.warning('请选择停用词库')
      return
    }

    if (!model) {
      message.warning('请选择分词模型')
      return
    }

    setSubmitting(true)
    try {
      // Resolve the file to upload
      let fileToUpload = localFile
      if (!fileToUpload && textContent.trim()) {
        fileToUpload = textContentToXLSX(textContent, 'input.xlsx')
      }

      if (!fileToUpload) {
        message.warning('请先上传数据')
        setSubmitting(false)
        return
      }

      // Upload input file
      const uploadRes = await uploadFile({
        file: fileToUpload,
        fileType: FILE_TYPE.COMPUTE_INPUT,
      })

      // Build custom stopwords file if needed
      let stopwordsUploadRes: TUploadFileResponse | undefined
      if (stopwordsFile) {
        stopwordsUploadRes = await uploadFile({
          file: stopwordsFile,
          fileType: FILE_TYPE.COMPUTE_INPUT,
        })
      } else if (customStopwords.trim()) {
        const file = textContentToXLSX(customStopwords, 'custom_stopwords.xlsx')
        stopwordsUploadRes = await uploadFile({
          file,
          fileType: FILE_TYPE.COMPUTE_INPUT,
        })
      }

      await onSubmit({
        inputFiles: [
          {
            id: uploadRes.fileId,
            name: 'user_data_oss_path',
            path: uploadRes.ossPath,
          },
          ... stopwordsUploadRes ? [{
            id: stopwordsUploadRes.fileId,
            name: 'user_stopwords_path',
            path: stopwordsUploadRes.ossPath,
          }] : [],
        ],
        taskName: taskName.trim(),
        taskParams: {
          user_selected_stopword_names: selectedLibraries.join('@'),
          seg_model: model,
        },
      })
    } catch (err) {
      message.error((err as Error).message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }, [
    localFile,
    textContent,
    selectedLibraries,
    customStopwords,
    stopwordsFile,
    model,
    taskName,
    onSubmit,
  ])

  const steps = [
    { title: '填写或上传数据' },
    { title: '选择停用词库和模型' },
    { title: '执行结果' },
  ]

  return (
    <div>
      <Steps current={currentStep} items={steps} className="mb-8" />
      {currentStep === 0 && (
        <div>
          <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-base font-bold">需要分词的文本</h3>
            <TextArea
              rows={6}
              placeholder="请输入需要分词的文本，例如新闻、评论等；不要超过 10,000 字；如果超过 10,000 字，建议上传文件。"
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
                onClick={() => setTextContent(TEST_TXT)}
                disabled={checkFileLoading || !!localFileName}
              >
                使用测试数据
              </Button>

              <Button
                icon={<DownloadOutlined />}
                type="default"
                onClick={() =>
                  createAndDownloadTemplateFile('分词与统计_数据模板.xlsx')
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
            <FileAlert keyword="待分词的文本" className="mt-2" />
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="primary" onClick={handleNextStep}>
              下一步
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Stopword & Model Config */}
      {currentStep === 1 && (
        <div>
          {stopwordLibraries.length > 0 && (
            <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-base font-bold">
                选用停用词库 <span className="text-red-500">*</span>
              </h3>
              <div className="flex flex-wrap gap-3">
                {stopwordLibraries.map((lib) => (
                  <label
                    key={lib.name}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
                      selectedLibraries.includes(lib.name)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <Checkbox
                      checked={selectedLibraries.includes(lib.name)}
                      onChange={(e) => {
                        setSelectedLibraries((prev) =>
                          e.target.checked
                            ? [...prev, lib.name]
                            : prev.filter((name) => name !== lib.name)
                        )
                      }}
                    />
                    <span>{lib.name}</span>
                    <span className="text-xs text-gray-400">{lib.count}词</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-base font-bold">
              自定义停用词{' '}
              <span className="text-sm font-normal text-orange-500">(可选)</span>
            </h3>
            <TextArea
              rows={4}
              placeholder="这里输入自定义停用词，用换行分隔；或者上传文件。"
              value={customStopwords}
              onChange={(e) => {
                setCustomStopwords(e.target.value)
                if (e.target.value.trim()) {
                  setStopwordsFile(null)
                  setStopwordsFileName(null)
                }
              }}
              maxLength={10000}
              showCount
              disabled={!!stopwordsFile || checkFileLoading}
            />

            <div className="my-2 flex flex-wrap gap-3">
              <Upload
                beforeUpload={handleStopwordsFileSelect}
                showUploadList={false}
                accept=".xlsx,.xls,.csv"
              >
                <Button icon={<UploadOutlined />} type="primary" loading={checkFileLoading}>
                  上传文件
                </Button>
              </Upload>

              <Button
                icon={<DownloadOutlined />}
                type="default"
                onClick={() =>
                  createAndDownloadTemplateFile('分词与统计_停用词模板.xlsx', [
                    ['id', 'text'],
                    [1, '停用词 1'],
                    [2, '停用词 2'],
                  ])
                }
              >
                下载模板
              </Button>

              {stopwordsFileName && (
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  <FileTextOutlined />
                  {stopwordsFileName}
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setStopwordsFile(null)
                      setStopwordsFileName(null)
                    }}
                  >
                    移除
                  </Button>
                </span>
              )}
            </div>
            <FileAlert keyword="自定义停用词" className="mt-2" />
          </div>

          <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-base font-bold">
              选用分词模型 <span className="text-red-500">*</span>
            </h3>
            <Radio.Group value={model} onChange={(e) => setModel(e.target.value)}>
              {models.map((m) => (
                <Radio key={m.name} value={m.name}>
                  {m.name}
                </Radio>
              ))}
            </Radio.Group>
          </div>

          <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
            <h3 className="mb-3 text-base font-bold">任务名称</h3>
            <Input
              placeholder="请输入任务名称"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              maxLength={200}
              showCount={true}
            />
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button onClick={() => setCurrentStep(0)}>上一步</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
              立即执行
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
