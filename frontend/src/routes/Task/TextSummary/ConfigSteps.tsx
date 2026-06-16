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
import type { TTextSummaryTaskParams, TInputFile } from '@/apis/ml_task'
import { createAndDownloadTemplateFile, textContentToXLSX } from '../utils'
import FileAlert from '../components/FileAlert'

const { TextArea } = Input

interface ConfigStepsProps {
  config: Record<string, unknown> | null
  configLoading: boolean
  onSubmit: (params: {
    inputFiles?: TInputFile[]
    taskName?: string
    taskParams?: TTextSummaryTaskParams
  }) => Promise<string | null>
}

const SAMPLE_TEXT = `近日，某市政府正式出台《数字治理三年行动计划（2026—2028年）》，提出围绕城市治理、民生保障、产业升级等方面持续推进数字化转型，重点支持智慧政务、智能交通等项目建设，提升城市运行效率和风险防控能力。市大数据管理局负责人介绍，未来三年将持续推进智慧城市建设，推动数字技术与制造业深度融合。多家企业代表在会上表示，将持续加大研发投入，推动行业高质量发展。专家指出，数字化转型对提升城市治理效能、改善民生具有重要意义，需要政府、企业、公众多方协同参与。本次会议还发布了一批重点项目清单，覆盖智慧医疗、智慧教育、智慧交通等领域，预计带动相关产业投资超百亿元。`

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
  const [purpose, setPurpose] = useState<string>('')
  const [maxLength, setMaxLength] = useState<number>(200)

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
          purpose: purpose.trim(),
          max_length: maxLength,
        },
      })
    } catch (err) {
      message.error((err as Error).message || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }, [localFile, textContent, purpose, maxLength, taskName, onSubmit])

  const steps = [{ title: '填写或上传数据' }, { title: '执行结果' }]

  return (
    <div>
      <Steps current={0} items={steps} className="mb-8" />

      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <h3 className="mb-3 text-base font-bold">请输入摘要要求</h3>
        <TextArea
          rows={4}
          placeholder="请输入具体的摘要要求，可以空白"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          maxLength={500}
          showCount={true}
        />
        <div className="mt-3 flex items-center gap-2">
          <span className="text-base font-bold">最大摘要字数</span>
          <InputNumber
            min={20}
            max={2000}
            value={maxLength}
            onChange={(v) => setMaxLength(v ?? 200)}
          />
        </div>
      </div>

      <div className="mb-6 rounded-sm border border-gray-200 bg-white p-4">
        <h3 className="mb-1 text-base font-bold">需要进行摘要的文本</h3>
        <p className="mb-3 text-sm text-gray-400">
          每行一篇文本；超过 10,000 字请上传文件，一次性最多 5000 行；id 字段需要不可重复，是唯一的
        </p>

        <TextArea
          rows={6}
          placeholder="请输入需要进行摘要的文本，每一行一篇文本；超过 10,000 字请上传文件。"
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
              createAndDownloadTemplateFile('文本摘要_数据模板.xlsx')
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

        <FileAlert keyword="原始文本" className="mt-2" />
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
