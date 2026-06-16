import { Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import Permission from '@/components/Permission'
import { PERMISSIONS } from '@/constants/permission'

interface ReportHeaderProps {
  title: string
  summary?: {
    startTime?: string | number
    endTime?: string | number
    elapsedSeconds?: number
  }
  onNewTask?: () => void
  children: React.ReactNode
}

export default function ReportHeader({
  title,
  summary,
  onNewTask,
  children,
}: ReportHeaderProps) {
  const formatTime = (t?: string | number) => {
    if (!t) return ''
    return dayjs(t).format('YYYY.M.DD HH:mm')
  }

  return (
    <div className="mx-auto bg-white">
      <h2 className="mb-2 text-center text-xl font-bold">{title}</h2>
      {onNewTask && (
        <div className="mb-4 flex justify-center">
          <Permission permission={[PERMISSIONS.TASKS]} mode="Alert">
            <Button icon={<PlusOutlined />} onClick={onNewTask}>
              开启新任务
            </Button>
          </Permission>
        </div>
      )}

      {summary && (
        <p className="mb-6 text-center text-sm text-gray-500">
          {summary.startTime && summary.endTime && (
            <span>
              {formatTime(summary.startTime)} – {formatTime(summary.endTime)}
            </span>
          )}
          {summary.elapsedSeconds != null && (
            <span className="ml-4">耗时：{summary.elapsedSeconds} 秒</span>
          )}
        </p>
      )}

      {children}
    </div>
  )
}
