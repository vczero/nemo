import React, { useContext, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import {
  Table,
  Typography,
  Skeleton,
  Empty,
  Tooltip,
  Input,
  Form,
  Tag,
  Popconfirm,
  Button,
  App,
} from 'antd'
import type { InputRef, FormInstance } from 'antd'
import {
  ControlOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  ClockCircleOutlined,
  MinusCircleFilled,
  EditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import ContentWrapper from '@/components/ContentWrapper'
import {
  GET_ML_TASK_LIST_ENDPOINT,
  getMLTaskList,
  updateMLTaskName,
  deleteMLTask,
} from '@/apis'
import type {
  TMLTaskListRequest,
  TMLTaskListResponse,
  TMLTaskResponse,
} from '@/apis/ml_task'
import {
  TASK_TYPE_LABELS,
  TASK_STATUS,
  TASK_STATUS_LABELS,
} from '@/constants/ml_task'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router'

const { Text, Link } = Typography

const formatTime = (time: number) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case TASK_STATUS.SUCCESS:
      return <CheckCircleFilled className="text-green-500" />
    case TASK_STATUS.RUNNING:
      return <LoadingOutlined className="text-blue-500" />
    case TASK_STATUS.PENDING:
      return <ClockCircleOutlined className="text-gray-400" />
    case TASK_STATUS.FAILED:
      return <CloseCircleFilled className="text-red-500" />
    case TASK_STATUS.CANCELLED:
      return <MinusCircleFilled className="text-gray-400" />
    default:
      return null
  }
}

const statusColor: Record<string, string> = {
  [TASK_STATUS.SUCCESS]: 'success',
  [TASK_STATUS.RUNNING]: 'processing',
  [TASK_STATUS.PENDING]: 'default',
  [TASK_STATUS.FAILED]: 'error',
  [TASK_STATUS.CANCELLED]: 'default',
}

const EditableContext = React.createContext<FormInstance<any> | null>(null)

const EditableRow: React.FC<{ index: number }> = ({ index, ...props }) => {
  const [form] = Form.useForm()
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  )
}

interface EditableCellProps {
  title: React.ReactNode
  editable: boolean
  dataIndex: keyof TMLTaskResponse
  record: TMLTaskResponse
  handleSave: (record: TMLTaskResponse) => Promise<void>
  children: React.ReactNode
}

const EditableCell: React.FC<
  EditableCellProps & React.HTMLAttributes<HTMLTableCellElement>
> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<InputRef>(null)
  const form = useContext(EditableContext)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
    }
  }, [editing])

  const startEdit = () => {
    if (!form) return
    form.setFieldsValue({ [dataIndex]: record[dataIndex] })
    setEditing(true)
  }

  const save = async () => {
    if (!form) return
    try {
      const values = await form.validateFields()
      const next = values[dataIndex].trim()
      if (next !== record[dataIndex]) {
        await handleSave({ ...record, [dataIndex]: next })
      }
      setEditing(false)
    } catch (errInfo) {
      console.log('Save failed:', errInfo)
    }
  }

  let childNode: React.ReactNode = children

  if (editable) {
    childNode = editing ? (
      <Form.Item
        className="m-0"
        name={dataIndex as string}
      >
        <Input
          size="small"
          ref={inputRef}
          onPressEnter={save}
          onBlur={save}
          className="w-40"
          maxLength={200}
        />
      </Form.Item>
    ) : (
      <span className="group flex items-center gap-1">
        <Text className="text-sm">
          {(record[dataIndex] as string) || '-'}
        </Text>
        <EditOutlined
          className="cursor-pointer text-xs text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={startEdit}
        />
      </span>
    )
  }

  return <td {...restProps}>{childNode}</td>
}

const Tasks: React.FC = () => {
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { message } = App.useApp()
  const navigate = useNavigate()

  const swrKey = [GET_ML_TASK_LIST_ENDPOINT, { pageNum, pageSize }] as const
  const { data, error, isLoading, mutate } = useSWR<TMLTaskListResponse>(
    swrKey,
    ([, params]: [string, TMLTaskListRequest]) => getMLTaskList(params),
    { keepPreviousData: true }
  )

  const handleSaveName = async (record: TMLTaskResponse) => {
    const optimisticData = (current?: TMLTaskListResponse) =>
      current
        ? {
            ...current,
            list: current.list.map((item) =>
              item.taskId === record.taskId
                ? { ...item, taskName: record.taskName }
                : item
            ),
          }
        : { list: [], pageNum: 1, pageSize: 10, total: 0 }
    try {
      await mutate(
        async (current) => {
          await updateMLTaskName(record.taskId, record.taskName || '')
          return optimisticData(current)
        },
        {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        }
      )
      message.success('任务名称已更新')
    } catch {
      message.error('更新失败')
    }
  }

  const handleDelete = async (record: TMLTaskResponse) => {
    try {
      await deleteMLTask(record.taskId)
      message.success('删除成功')
      mutate()
    } catch {
      message.error('删除失败')
    }
  }

  const handleViewResult = (record: TMLTaskResponse) => {
    navigate(`/apps/task?taskType=${record.taskType}&taskId=${record.taskId}`)
  }

  const columns: (ColumnsType<TMLTaskResponse>[number] & {
    editable?: boolean
    dataIndex?: keyof TMLTaskResponse | string
  })[] = [
    {
      title: '任务类型',
      dataIndex: 'taskType',
      key: 'taskType',
      width: 140,
      render: (type: string) => (
        <Text className="text-sm">{TASK_TYPE_LABELS[type] || type}</Text>
      ),
    },
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: 180,
      render: (text) => (
        <Text className="text-xs text-gray-500">{text}</Text>
      ),
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      width: 200,
      editable: true,
      onCell: (record: TMLTaskResponse) => ({
        record,
        editable: true,
        dataIndex: 'taskName',
        title: '任务名称',
        handleSave: handleSaveName,
      })
    },
    {
      title: '创建时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 160,
      render: (time: number) => (
        <Text className="text-xs">{formatTime(time)}</Text>
      ),
    },
    {
      title: '完成时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 160,
      render: (time: number) => (
        <Text className="text-xs">{formatTime(time)}</Text>
      ),
    },
    {
      title: '任务状态',
      dataIndex: 'taskStatus',
      key: 'taskStatus',
      width: 100,
      render: (status: string) => (
        <Tag
          icon={<StatusIcon status={status} />}
          color={statusColor[status]}
          variant="filled"
        >
          {TASK_STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => {
        const isSuccess = record.taskStatus === TASK_STATUS.SUCCESS
        const isFailed = record.taskStatus === TASK_STATUS.FAILED
        return (
          <span className="flex items-center gap-3">
            {isSuccess && (
              <Link
                className="text-sm"
                onClick={() => handleViewResult(record)}
              >
                查看结果
              </Link>
            )}
            {isFailed && (
              <Tooltip title={record.errorMessage || '未知错误'}>
                <Link type="danger" className="text-sm">
                  查看原因
                </Link>
              </Tooltip>
            )}
            <Popconfirm
              classNames={{ root: 'max-w-[400px]' }}
              title="确认删除"
              description="您删除了该计算任务，对应的图表和结果将一并删除，请确认"
              onConfirm={async (e) => {
                e?.stopPropagation()
                return handleDelete(record)
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="删除"
              cancelText="取消"
            >
              <Button type="text" danger onClick={(e) => e?.stopPropagation()}>
                删除
              </Button>
            </Popconfirm>
          </span>
        )
      },
    },
  ]

  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  }

  return (
    <ContentWrapper
      title="我的计算任务"
      icon={<ControlOutlined />}
      withSpace={false}
    >
      <div className="bg-white p-4 shadow-sm">
        {isLoading && !data?.list?.length ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : error ? (
          <Empty description="加载失败，请稍后重试" />
        ) : (
          <Table
            components={components}
            columns={columns}
            dataSource={data?.list || []}
            rowKey="taskId"
            pagination={{
              current: pageNum,
              pageSize: pageSize,
              total: data?.total || 0,
              showTotal: (total) => `共 ${total} 条任务`,
              onChange: (page, size) => {
                setPageNum(page)
                setPageSize(size)
              },
            }}
            scroll={{ x: 'max-content' }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无计算任务"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </div>
    </ContentWrapper>
  )
}

export default Tasks
