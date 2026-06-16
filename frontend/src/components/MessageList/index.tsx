import React, { useState } from 'react'
import useSWR from 'swr'
import {
  List,
  Avatar,
  Tag,
  Button,
  Drawer,
  Typography,
  Skeleton,
  Space,
  Badge,
} from 'antd'
import {
  BellOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DesktopOutlined,
  ControlOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import {
  getMessages,
  markAsReaded,
  markAllReaded,
  GET_MESSAGES_ENDPOINT,
} from '@/apis'
import type { TMessageItem } from '@/apis/types'
import type { TMessagePriority, TMessageType } from '@/constants/common'
import {
  MESSAGE_PRIORITY,
  MESSAGE_STATUS,
  MESSAGE_TYPE,
} from '@/constants/common'

import ContentWrapper from '@/components/ContentWrapper'
import { useUser } from '@/contexts/UserContext'

const { Paragraph } = Typography

const PriorityTag: React.FC<{ priority: TMessagePriority }> = ({
  priority,
}) => {
  const config = {
    [MESSAGE_PRIORITY.URGENT]: {
      color: 'red',
      text: '紧急',
      icon: <WarningOutlined />,
    },
    [MESSAGE_PRIORITY.IMPORTANT]: {
      color: 'orange',
      text: '重要',
      icon: <InfoCircleOutlined />,
    },
    [MESSAGE_PRIORITY.NORMAL]: {
      color: 'blue',
      text: '普通',
      icon: <InfoCircleOutlined />,
    },
  }
  const { color, text, icon } = config[priority]
  return (
    <Tag color={color} icon={icon}>
      {text}
    </Tag>
  )
}

const TypeIcon: React.FC<{ type: TMessageType }> = ({ type }) => {
  const config = {
    [MESSAGE_TYPE.COMPUTE]: <ControlOutlined className="text-blue-500" />,
    [MESSAGE_TYPE.INVOICE]: <FileTextOutlined className="text-orange-500" />,
    [MESSAGE_TYPE.SYSTEM]: <DesktopOutlined className="text-purple-500" />,
    [MESSAGE_TYPE.OTHER]: <BellOutlined className="text-gray-500" />,
  }
  return <Avatar style={{ backgroundColor: '#f0f5ff' }} icon={config[type]} />
}

interface TMessageListProps {
  types: TMessageType[]
  title: string
  icon: React.ReactNode
}

const MessageList: React.FC<TMessageListProps> = ({
  types,
  title,
  icon,
}: TMessageListProps) => {
  const navigate = useNavigate()
  const [pageNum, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeMsg, setActiveMsg] = useState<TMessageItem & { _ywl_task_id: string, _ywl_task_type: string } | null>(null)
  const [markAllReadedLoading, setMarkAllReadedLoading] = useState(false)
  const { mutateUnreadMessageCountData } = useUser()

  const params = {
    pageNum,
    pageSize,
    status: [MESSAGE_STATUS.UNREAD, MESSAGE_STATUS.READ],
    types: types,
  }

  const swrKey = [GET_MESSAGES_ENDPOINT, params] as const
  const { data, isLoading, mutate, error } = useSWR(
    swrKey,
    ([_, params]) => getMessages(params),
    {
      keepPreviousData: true,
    }
  )

  const handleItemClick = async (item: TMessageItem) => {
    const linkId = item.linkId
    const [id, type] = linkId?.split('#') || []
    setActiveMsg({...item, _ywl_task_id: id, _ywl_task_type: type})
    setDrawerOpen(true)

    if (item.status === MESSAGE_STATUS.UNREAD) {
      try {
        await markAsReaded({ id: item.notificationId })

        mutate((currentData) => {
          if (!currentData) return currentData
          const newList = currentData?.list.map((msg: TMessageItem) => {
            if (msg.notificationId === item.notificationId) {
              return { ...msg, status: MESSAGE_STATUS.READ }
            }
            return msg
          })
          return { ...currentData, list: newList }
        }, false)
        mutateUnreadMessageCountData()
      } catch (e) {
        console.error('标记已读失败', e)
      }
    }
  }

  const handleMarkAllRead = async () => {
    try {
      setMarkAllReadedLoading(true)
      await markAllReaded()
      await mutate()
      await mutateUnreadMessageCountData()
      setMarkAllReadedLoading(false)
    } catch (e) {
      console.error('全部标记失败', e)
    }
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setActiveMsg(null)
  }

  return (
    <ContentWrapper
      title={title}
      icon={icon}
      extra={
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={handleMarkAllRead}
          loading={markAllReadedLoading}
          disabled={isLoading}
        >
          全部已读
        </Button>
      }
    >
      {isLoading && data === undefined && error === undefined ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : (
        <List
          loading={isLoading}
          itemLayout="horizontal"
          dataSource={data?.list || []}
          pagination={{
            onChange: (page, pageSize) => {
              setPage(page)
              setPageSize(pageSize)
            },
            current: pageNum,
            pageSize: pageSize,
            total: data?.total || 0,
            showTotal: (total) => `共 ${total} 条消息`,
            align: 'center',
          }}
          renderItem={(item: TMessageItem) => (
            <List.Item
              className={`cursor-pointer px-4 transition-colors hover:bg-gray-50 ${item.status === MESSAGE_STATUS.UNREAD ? 'bg-blue-50/30' : ''} `}
              onClick={() => handleItemClick(item)}
              actions={[
                <div
                  key="time"
                  className="min-w-[80px] text-right text-xs text-gray-400"
                >
                  {dayjs(item.createTime).format('MM-DD HH:mm')}
                </div>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Badge
                    dot={item.status === MESSAGE_STATUS.UNREAD}
                    offset={[-2, 2]}
                  >
                    <TypeIcon type={item.type} />
                  </Badge>
                }
                title={
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        item.status === MESSAGE_STATUS.UNREAD
                          ? 'font-bold text-gray-800'
                          : 'text-gray-600'
                      }
                    >
                      {item.title}
                    </span>
                    <PriorityTag priority={item.priority} />
                  </div>
                }
                description={
                  <div className="line-clamp-1 text-sm text-gray-400">
                    {item.content}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <TypeIcon type={activeMsg?.type || 'SYSTEM'} />
            <span>消息详情</span>
          </div>
        }
        placement="right"
        size="480px"
        onClose={handleCloseDrawer}
        open={drawerOpen}
        extra={
          activeMsg?.type === 'COMPUTE' && activeMsg?._ywl_task_id && activeMsg?._ywl_task_type ? (
            <Button type="primary" onClick={() => navigate(`/apps/task?taskType=${activeMsg._ywl_task_type}&taskId=${activeMsg._ywl_task_id}`)}>
              跳转处理
            </Button>
          ) : null
        }
      >
        {activeMsg ? (
          <div className="flex h-full flex-col">
            <div className="mb-6">
              <h2 className="mb-3 text-xl font-bold text-gray-800">
                {activeMsg.title}
              </h2>
              <Space size="large" className="text-sm text-gray-500">
                <span>
                  <ClockCircleOutlined className="mr-1" />
                  {dayjs(activeMsg.createTime).format('YYYY-MM-DD HH:mm:ss')}
                </span>
                <PriorityTag priority={activeMsg.priority} />
              </Space>
            </div>
            <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 p-4 text-base leading-relaxed text-gray-700">
              <Paragraph>{activeMsg.content}</Paragraph>
            </div>
            {activeMsg.linkUrl && (
              <div className="mt-6 border-t border-gray-100 pt-4 text-right">
                <Button type="primary" href={activeMsg.linkUrl} target="_blank">
                  跳转处理
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Skeleton active />
        )}
      </Drawer>
    </ContentWrapper>
  )
}

export default MessageList
