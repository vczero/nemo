import React, { useState } from 'react'
import useSWR from 'swr'
import { Typography, Button, Skeleton, App, Table, Empty, Tooltip, Alert } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  GET_INVITATION_INFO_ENDPOINT,
  GET_POINTS_BALANCE_ENDPOINT,
  GET_POINTS_RECORDS_ENDPOINT,
  getPointsRecords,
} from '@/apis'
import type {
  TGetPointsRecordsResponse,
  TPointsRecord,
  TGetInvitationInfoResponse,
  TGetPointsBalanceResponse,
} from '@/apis/types'
const { Text, Paragraph } = Typography
import { copyToClipboard } from '@/utils/utils'
import { GiftOutlined } from '@ant-design/icons'
import ContentWrapper from '@/components/ContentWrapper'


const TYPE_NAME = {
  ACTIVITY: '活动奖励',
  ADMIN_ADJUST: '管理员调整',
  INVITED_REWARD: '带新福利（被邀请）',
  INVITE_REWARD: '带新福利（邀请）',
  ORDER_DEDUCT: '订单扣除',
} as const

const columns: ColumnsType<TPointsRecord> = [
  {
    title: 'ID',
    dataIndex: 'recordId',
    key: 'recordId',
    width: 180,
    render: (text) => (
      <Tooltip title={text}>
        <Text copyable className="text-xs">
          {text}
        </Text>
      </Tooltip>
    ),
  },
  {
    title: '积分来源',
    dataIndex: 'type',
    key: 'type',
    width: 150,
    render: (type) => <Text>{TYPE_NAME[type as keyof typeof TYPE_NAME]}</Text>,
  },
  {
    title: '积分数量',
    dataIndex: 'points',
    key: 'points',
    width: 120,
    render: (points) => (
      <Text type={points > 0 ? 'success' : 'danger'} strong>
        {points > 0 ? `+${points}` : points}
      </Text>
    ),
  },
  {
    title: '时间',
    dataIndex: 'createTime',
    key: 'createTime',
    width: 160,
    render: (time) => (
      <Text className="text-xs">{dayjs(time).format('YYYY-MM-DD HH:mm')}</Text>
    ),
  },
]
const Benefits: React.FC = () => {
  const { message } = App.useApp()
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const {
    data: invitationInfoData,
    error: invitationInfoError,
    isLoading: isInvitationInfoLoading,
  } = useSWR<TGetInvitationInfoResponse>(GET_INVITATION_INFO_ENDPOINT)
  const {
    data: pointsStatsData,
    error: pointsStatsError,
    isLoading: isPointsStatsLoading,
  } = useSWR<TGetPointsBalanceResponse>(GET_POINTS_BALANCE_ENDPOINT)
  const swrKey = [GET_POINTS_RECORDS_ENDPOINT, { pageNum, pageSize }] as const
  const {
    data: recordsData,
    error: recordsError,
    isLoading: recordsLoading,
  } = useSWR<TGetPointsRecordsResponse>(
    swrKey,
    () => getPointsRecords({ pageNum, pageSize }),
    {
      keepPreviousData: true,
    }
  )

  const { invitationCode = '' } = invitationInfoData || {}
  const inviteLink = `https://ywllab.com/?inviteCode=${invitationCode}`
  const handleCopy = async (text: string, label: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      message.success(`复制${label}成功`)
    } else {
      message.error('复制失败，请手动复制')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <ContentWrapper title="带新福利" icon={<GiftOutlined />} info={invitationInfoError ? <Alert title="邀请码获取失败，请稍后重试" type="error" /> : null}>
        <div className="mb-2 text-lg font-bold text-gray-800">提示</div>
        <div className="rounded-sm bg-gray-100 p-4 text-lg text-gray-800">
          <Paragraph className="mb-2">
            每邀请 1 人，即可获得 5 积分，积分可以用来抵扣充值，对方可以获得 2
            积分。
            <br />
            邀请码和链接均可以！分享到知乎、小红书；分享给同学、同事、朋友均是带新，双方可获得积分。
          </Paragraph>
        </div>
        <div className="mt-6 mb-2 text-lg font-bold text-gray-800">邀请码</div>
        {isInvitationInfoLoading ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm bg-gray-100 p-4 text-lg text-gray-800">
            <Text className="text-lg font-bold">{invitationCode}</Text>
            <Button
              type="primary"
              className="w-25"
              onClick={() => handleCopy(invitationCode, '邀请码')}
            >
              复制邀请码
            </Button>
          </div>
        )}
        <div className="mt-6 mb-2 font-bold text-gray-800">邀请链接</div>
        {isInvitationInfoLoading || invitationInfoError ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm bg-gray-100 p-4 text-lg text-gray-800">
            <Text
              className="overflow-hidden text-ellipsis whitespace-nowrap"
              ellipsis={{ tooltip: inviteLink }}
            >
              {inviteLink}
            </Text>

            <Button
              type="primary"
              className="w-25"
              onClick={() => handleCopy(inviteLink, '链接')}
            >
              复制链接
            </Button>
          </div>
        )}
      </ContentWrapper>
      <ContentWrapper styles={{ root: { paddingTop: 0 } }}>
        <h3 className="mb-2 text-lg font-bold text-gray-800">积分记录</h3>
        {isPointsStatsLoading || pointsStatsError ? (
          <Skeleton active paragraph={{ rows: 1 }} />
        ) : (
          <Paragraph className="mb-4">
            当前累计积分
            <span className="text-red-500">
              {' '}
              {pointsStatsData?.totalPoints ?? '-'}{' '}
            </span>
            ，其中带新
            <span className="text-red-500">
              {' '}
              {pointsStatsData?.invitedCount ?? '-'}{' '}
            </span>
            人，已使用
            <span className="text-red-500">
              {' '}
              {pointsStatsData?.usedPoints ?? '-'}{' '}
            </span>
            积分， 剩余
            <span className="text-red-500">
              {' '}
              {pointsStatsData?.pointBalance ?? '-'}{' '}
            </span>
            积分； 积分仅用于抵扣充值。
          </Paragraph>
        )}
        {recordsLoading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : recordsError ? (
          <Empty description="加载失败，请稍后重试" />
        ) : (
          <Table
            columns={columns}
            dataSource={recordsData?.list || []}
            rowKey="recordId"
            loading={recordsLoading}
            pagination={{
              current: pageNum,
              pageSize: pageSize,
              total: recordsData?.total || 0,
              showSizeChanger: false,
              showQuickJumper: false,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, size) => {
                setPageNum(page)
                setPageSize(size)
              },
            }}
            locale={{
              emptyText: (
                <Empty
                  description="暂无积分记录"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </ContentWrapper>
    </div>
  )
}

export default Benefits
