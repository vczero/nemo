import { Progress } from 'antd'
import {
  CheckCircleFilled,
  LoadingOutlined,
  ClockCircleOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons'
import type { TTaskStatus } from '@/constants/ml_task'
import { TASK_STATUS } from '@/constants/ml_task'

interface TaskProgressModalProps {
  taskStatus: TTaskStatus | null
}

const STATUS_STAGES: {
  key: string
  label: string
  matchStatus: TTaskStatus[]
}[] = [
  {
    key: 'validated',
    label: '数据格式验证通过',
    matchStatus: [
      TASK_STATUS.PENDING,
      TASK_STATUS.RUNNING,
      TASK_STATUS.SUCCESS,
    ],
  },
  {
    key: 'started',
    label: '计算任务开始执行',
    matchStatus: [TASK_STATUS.RUNNING, TASK_STATUS.SUCCESS],
  },
]

function getPercent(status: TTaskStatus | null): number {
  if (!status) return 0
  if (status === TASK_STATUS.PENDING) return 10
  if (status === TASK_STATUS.RUNNING) return 50
  if (status === TASK_STATUS.SUCCESS) return 100
  return 0
}

export default function TaskProgress({
  taskStatus,
}: TaskProgressModalProps) {
  const percent = getPercent(taskStatus)
  const isFailed =
    taskStatus === TASK_STATUS.FAILED || taskStatus === TASK_STATUS.CANCELLED

  return (
    <div className="py-4 text-center">
      <h3 className="mb-6 text-lg font-bold">计算任务进度</h3>

      {/* Stage list */}
      <div className="mx-auto mb-6 inline-flex flex-col items-start gap-3">
        {STATUS_STAGES.map((stage) => {
          const completed =
            taskStatus != null &&
            stage.matchStatus.includes(taskStatus)
          const active =
            !completed &&
            taskStatus != null &&
            !isFailed
          return (
            <div key={stage.key} className="flex items-center gap-2 text-sm">
              {completed ? (
                <CheckCircleFilled className="text-base text-green-500" />
              ) : active ? (
                <LoadingOutlined className="text-base text-blue-500" />
              ) : (
                <ClockCircleOutlined className="text-base text-gray-300" />
              )}
              <span
                className={
                  completed
                    ? 'text-gray-800'
                    : active
                      ? 'text-blue-600'
                      : 'text-gray-400'
                }
              >
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress ring */}
      {!isFailed && (
        <div className="mb-4">
          <Progress
            type="circle"
            percent={percent}
            size={100}
            strokeColor="#4f46e5"
          />
        </div>
      )}

      {/* Hint */}
      {isFailed ? (
        <p className="mt-4 flex items-center justify-center gap-1 text-sm text-red-500">
          <ExclamationCircleFilled />
          任务执行失败，请重试
        </p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-gray-700">
          任务执行完后将通过站内信通知
        </p>
      )}

      {!isFailed && (
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-red-500">
          <ExclamationCircleFilled />
          后续请在【我的计算任务】中查看运行结果。
        </p>
      )}
    </div>
  )
}
