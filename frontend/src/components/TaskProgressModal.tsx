import { Modal, Progress } from 'antd'
import {
  CheckCircleFilled,
  LoadingOutlined,
  InfoCircleFilled,
} from '@ant-design/icons'
import { Link } from 'react-router'

export interface TaskProgressStage {
  key: string
  label: string
  completed: boolean
}

interface TaskProgressModalProps {
  open: boolean
  percent: number
  stages: TaskProgressStage[]
  onClose?: () => void
}

export default function TaskProgressModal({
  open,
  percent,
  stages,
  onClose,
}: TaskProgressModalProps) {
  return (
    <Modal
      open={open}
      footer={null}
      closable={!!onClose}
      onCancel={onClose}
      width={480}
      centered
      title={null}
      maskClosable={false}
    >
      <div className="py-4 text-center">
        <h2 className="mb-8 text-lg font-semibold">计算任务进度</h2>

        <div className="mx-auto mb-8 flex max-w-xs flex-col items-start gap-3">
          {stages.map((stage) => (
            <div key={stage.key} className="flex items-center gap-2 text-sm">
              {stage.completed ? (
                <CheckCircleFilled className="text-base text-green-500" />
              ) : (
                <LoadingOutlined className="text-base text-gray-300" />
              )}
              <span
                className={stage.completed ? 'text-gray-800' : 'text-gray-400'}
              >
                {stage.label}
              </span>
            </div>
          ))}
        </div>

        <Progress
          type="circle"
          percent={percent}
          size={120}
          strokeColor={{ '0%': '#4096ff', '100%': '#1677ff' }}
        />

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
          <InfoCircleFilled className="text-orange-400" />
          <span>
            你可以关闭当前页面，后续从
            <Link to="/tasks" className="mx-1 text-blue-500">
              【我的计算任务】
            </Link>
            中查看运行结果
          </span>
        </div>
      </div>
    </Modal>
  )
}
