import React, { useState, useEffect } from 'react'
import { Table, Tabs, Statistic, Row, Col, message, Space } from 'antd'
import { GiftOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons'
import { getInvitationCodePage, getInvitationRecordPage, getInvitationStatistics } from '../services/invitationCode'
import { CompactBreadcrumb } from '../components/CompactHeader'

const { TabPane } = Tabs

const InvitationCodeManagement = () => {
  const [activeTab, setActiveTab] = useState('codes')
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState(null)
  const [codes, setCodes] = useState([])
  const [records, setRecords] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const fetchStatistics = async () => {
    try {
      const res = await getInvitationStatistics()
      setStatistics(res.data)
    } catch (error) {
      message.error('获取统计数据失败')
    }
  }

  const fetchCodes = async () => {
    setLoading(true)
    try {
      const res = await getInvitationCodePage({
        pageNum: page,
        pageSize,
      })
      setCodes(res.data || [])
      setTotal(res.total || 0)
    } catch (error) {
      message.error('获取邀请码列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const res = await getInvitationRecordPage({
        pageNum: page,
        pageSize,
      })
      setRecords(res.data || [])
      setTotal(res.total || 0)
    } catch (error) {
      message.error('获取邀请记录列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatistics()
    if (activeTab === 'codes') {
      fetchCodes()
    } else {
      fetchRecords()
    }
  }, [activeTab, page, pageSize])

  const codeColumns = [
    { title: 'ID', dataIndex: 'invitationCodeId', width: 200, ellipsis: true },
    { title: '邀请码', dataIndex: 'code', width: 150 },
    { title: '邀请人用户名', dataIndex: 'inviterUsername', width: 150 },
    { title: '邀请人邮箱', dataIndex: 'inviterEmail', width: 200 },
    { title: '使用次数', dataIndex: 'usedCount', width: 100 },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
  ]

  const recordColumns = [
    { title: 'ID', dataIndex: 'id', width: 200, ellipsis: true },
    { title: '邀请人用户名', dataIndex: 'inviterUsername', width: 150 },
    { title: '邀请人邮箱', dataIndex: 'inviterEmail', width: 200 },
    { title: '被邀请人用户名', dataIndex: 'inviteeUsername', width: 150 },
    { title: '被邀请人邮箱', dataIndex: 'inviteeEmail', width: 200 },
    { title: '邀请码', dataIndex: 'invitationCode', width: 150 },
    {
      title: '邀请时间',
      dataIndex: 'inviteTime',
      width: 180,
      render: (text) => new Date(text).toLocaleString(),
    },
  ]

  return (
    <div>
      <Row gutter={12} className="stats-row" style={{ marginBottom: 8 }}>
        <Col span={6}>
          <Statistic
            title="总邀请码数"
            value={statistics?.totalCodes || 0}
            prefix={<GiftOutlined style={{ color: '#007acc', fontSize: 13 }} />}
            valueStyle={{ color: '#d4d4d4', fontWeight: 600, fontSize: 17 }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="总邀请次数"
            value={statistics?.totalInvitations || 0}
            prefix={<UserOutlined style={{ color: '#007acc', fontSize: 13 }} />}
            valueStyle={{ color: '#d4d4d4', fontWeight: 600, fontSize: 17 }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="邀请人数"
            value={statistics?.totalInviters || 0}
            prefix={<TeamOutlined style={{ color: '#007acc', fontSize: 13 }} />}
            valueStyle={{ color: '#d4d4d4', fontWeight: 600, fontSize: 17 }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="被邀请人数"
            value={statistics?.totalInvitees || 0}
            prefix={<TeamOutlined style={{ color: '#007acc', fontSize: 13 }} />}
            valueStyle={{ color: '#d4d4d4', fontWeight: 600, fontSize: 17 }}
          />
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="邀请码列表" key="codes">
          <div className="table-container">
            <Table
              rowKey="invitationCodeId"
              columns={codeColumns}
              dataSource={codes}
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: total => `共 ${total} 条`,
                size: 'small',
                onChange: (page, pageSize) => {
                  setPage(page)
                  setPageSize(pageSize)
                },
              }}
              size="small"
            />
          </div>
        </TabPane>
        <TabPane tab="邀请记录" key="records">
          <div className="table-container">
            <Table
              rowKey="id"
              columns={recordColumns}
              dataSource={records}
              loading={loading}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: total => `共 ${total} 条`,
                size: 'small',
                onChange: (page, pageSize) => {
                  setPage(page)
                  setPageSize(pageSize)
                },
              }}
              size="small"
            />
          </div>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default InvitationCodeManagement
