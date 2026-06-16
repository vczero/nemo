import React from 'react'
import { Row, Col, Statistic } from 'antd'
import { Space, Button } from 'antd'

export const PageHeader = ({ title, extra }) => (
  <div className="page-header">
    <h2 className="page-title">{title}</h2>
    <Space>{extra}</Space>
  </div>
)

export const StatsRow = ({ children }) => (
  <Row gutter={16} className="stats-row">
    {children.map((child, index) => (
      <Col key={index} span={6}>
        {child}
      </Col>
    ))}
  </Row>
)

export const StatItem = ({ title, value, prefix, suffix, valueStyle }) => (
  <Statistic
    title={title}
    value={value}
    prefix={prefix}
    suffix={suffix}
    valueStyle={{
      color: '#d4d4d4',
      fontWeight: 600,
      fontSize: '20px',
      ...valueStyle
    }}
  />
)

export const ActionBar = ({ children }) => (
  <div className="action-bar">
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      {children}
    </Space>
  </div>
)

export const ActionGroup = ({ children }) => (
  <Space>
    {children}
  </Space>
)

export const FilterGroup = ({ children }) => (
  <Space size="small">
    {children}
  </Space>
)
