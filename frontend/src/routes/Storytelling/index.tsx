import { useState } from 'react'
import useSWR from 'swr'
import {
  Table,
  Button,
  Space,
  Empty,
  Popconfirm,
  App,
  Skeleton,
  Tooltip,
  Typography,
  Tag,
} from 'antd'
import {
  PlusOutlined,
  ReadOutlined,
  RobotOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import {
  GET_STORY_LIST_ENDPOINT,
  getStoryList,
  deleteStory,
  type TStoryItem,
  type TStoryListRequest,
} from '@/apis'
import ContentWrapper from '@/components/ContentWrapper'
import { SUBSCRIPTION_PERMISSION_GROUPS } from '@/constants/permission'

const { Text } = Typography

export default function StorytellingList() {
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const { message } = App.useApp()
  const navigate = useNavigate()

  const swrKey = [GET_STORY_LIST_ENDPOINT, { pageNum, pageSize }] as const
  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    ([, params]: [string, TStoryListRequest]) => getStoryList(params),
    { keepPreviousData: true }
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteStory(id)
      message.success('删除成功')
      mutate()
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  const handleShare = (doi: string) => {
    const url = `${window.location.origin}/sharedata?doi=${doi}`
    window.open(url, '_blank')
  }

  const columns: ColumnsType<TStoryItem> = [
    {
      title: '报告ID',
      dataIndex: 'storyId',
      key: 'storyId',
      width: 220,
      render: (text) => (
        <Text copyable className="text-xs">
          {text}
        </Text>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 140,
      render: (time) => (
        <Text className="text-xs">
          {dayjs(time).format('YYYY.MM.DD HH:mm')}
        </Text>
      ),
    },
    // {
    //   title: '状态',
    //   dataIndex: 'status',
    //   key: 'status',
    //   width: 60,
    //   render: (status: TStoryItem['status']) => <Tag color="green">已发布</Tag>,
    // },
    {
      title: '操作',
      key: 'action',
      width: 210,
      render: (_, record) => (
        <div className="flex items-center gap-1">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleShare(record.storyId)}
            className="px-1!"
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/apps/storytelling/edit?id=${record.storyId}`)
            }
            className="px-1!"
          >
            编辑
          </Button>
          <Popconfirm
            title="删除报告"
            description="删除后无法恢复, 确定要删除吗?"
            okText="删除"
            cancelText="取消"
            onConfirm={() => handleDelete(record.storyId)}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              className="px-1!"
            >
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ]

  return (
    <ContentWrapper
      title="研究报告（Storytelling）"
      icon={<ReadOutlined />}
      permission={SUBSCRIPTION_PERMISSION_GROUPS.STANDARD}
      extra={
        <Space className="flex justify-between">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/apps/storytelling/edit')}
          >
            选择已有图表创建
          </Button>
          <Tooltip title="即将开放">
            <Button
              type="primary"
              icon={<RobotOutlined />}
              disabled
            >
              从数据智能体创建
            </Button>
          </Tooltip>
        </Space>
      }
    >
      {isLoading && !data?.list?.length ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : error ? (
        <Empty description="加载失败, 请稍后重试" />
      ) : (
        <Table
          columns={columns}
          dataSource={data?.list || []}
          rowKey="storyId"
          pagination={{
            current: pageNum,
            pageSize,
            total: data?.total || 0,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, size) => {
              setPageNum(page)
              setPageSize(size)
            },
          }}
          locale={{
            emptyText: (
              <Empty
                description="暂无研究报告, 点击右上角按钮创建"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      )}
    </ContentWrapper>
  )
}
