import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Skeleton, Result, Button } from 'antd'
import { AppstoreOutlined } from '@ant-design/icons'
import { ICON_COMPONENTS } from '@/constants/apps'
import ContentWrapper from '@/components/ContentWrapper'
import { useMLAppTask } from '@/hooks/useMLAppTask'
import TaskProgress from '@/routes/Task/components/TaskProgress'
import { TASK_METADATA_MAP, type TTaskType } from '@/constants/ml_task'
import { getTaskRegistry } from './registry'
import { PERMISSIONS } from '@/constants/permission'

export default function MLTaskPage() {
  const [searchParams] = useSearchParams()
  const taskType = (searchParams.get('taskType') || '') as unknown as TTaskType
  const metadata = TASK_METADATA_MAP[taskType]
  const registry = useMemo(() => getTaskRegistry(taskType), [taskType])

  if (!taskType || !registry || !metadata) {
    return (
      <ContentWrapper title="计算任务" icon={<AppstoreOutlined />}>
        <Result status="404" title="未指定任务类型或任务类型不存在" subTitle="请检查 URL 是否正确" />
      </ContentWrapper>
    )
  }

  return (
    <MLTaskContent
      key={taskType}
      taskType={taskType}
      metadata={metadata}
      registry={registry}
    />
  )
}

interface MLTaskContentProps {
  taskType: TTaskType
  metadata: NonNullable<(typeof TASK_METADATA_MAP)[TTaskType]>
  registry: NonNullable<ReturnType<typeof getTaskRegistry>>
}

function MLTaskContent({ taskType, metadata, registry }: MLTaskContentProps) {
  const [searchParams] = useSearchParams()
  const taskId = searchParams.get('taskId')
  const {
    phase,
    config,
    submitTask,
    result,
    taskStatus,
    startNewTask,
    error,
    configError,
  } = useMLAppTask(taskType)

  const { ConfigSteps, Report } = registry
  const { title, description, icon } = metadata
  const IconComponent = ICON_COMPONENTS[icon as keyof typeof ICON_COMPONENTS] || AppstoreOutlined

  return (
    <ContentWrapper
      title={title || taskType}
      description={description}
      icon={<IconComponent />}
      permission={taskId ? undefined : PERMISSIONS.TASKS }
    >
      <Suspense fallback={<Skeleton active paragraph={{ rows: 7 }} />}>
        {phase === 'loading' && (
          <div className="flex justify-center">
            <Skeleton active paragraph={{ rows: 7 }} />
          </div>
        )}

        {(phase === 'config' || phase === 'submitting') && !configError && (
          <ConfigSteps config={config} onSubmit={submitTask} />
        )}

        {phase === 'config' && configError ? (
          <Result
            status="error"
            title="任务配置异常，请稍后重试"
            subTitle={configError.message}
          />
        ) : null}

        {phase === 'polling' && <TaskProgress taskStatus={taskStatus} />}

        {phase === 'completed' && result && (
          <Report result={result} onNewTask={startNewTask} />
        )}

        {phase === 'failed' && (
          <div className="mx-auto p-6 text-center">
            <Result
              status="error"
              title="任务执行失败"
              subTitle={error || '任务执行失败'}
              extra={
                <Button type="primary" onClick={startNewTask}>
                  重新开始
                </Button>
              }
            />
          </div>
        )}
      </Suspense>
    </ContentWrapper>
  )
}
