import React from 'react'
import { Typography } from 'antd'
import Permission from '@/components/Permission'
import type { TPermission } from '@/constants/permission'

interface ContentWrapperProps {
  title?: string | React.ReactNode
  icon?: React.ReactNode
  children: React.ReactNode
  description?: string
  extra?: React.ReactNode
  className?: string
  withSpace?: boolean
  info?: React.ReactNode
  styles?: {
    root?: React.CSSProperties
    title?: React.CSSProperties
    description?: React.CSSProperties
    content?: React.CSSProperties
  }
  permission?: TPermission | TPermission[]
}

const ContentWrapper: React.FC<ContentWrapperProps> = ({
  title,
  icon,
  children,
  description,
  extra,
  styles,
  className,
  info,
  withSpace = true,
  permission,
}) => {
  return (
    <div className={`${className || ''} w-full p-4 flex flex-col`} style={styles?.root}>
      {(title || extra) && (
        <div
          className={`flex items-center justify-between ${description ? '' : 'mb-4'}`}
          style={styles?.title}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            {icon}<span className="ms-2">{title}</span>
          </Typography.Title>
          {extra}
        </div>
      )}
      {description && (
        <p className="mt-2 mb-4 text-gray-500" style={styles?.description}>
          {description}
        </p>
      )}
      {info ? <div className="mb-4">{info}</div> : null}
      <div className={withSpace ? 'bg-white shadow-sm p-4' : ''} style={styles?.content}>
        {
          permission && permission.length ? (
            <Permission permission={permission} mode="render">
              {children}
            </Permission>
          ) : (
            children
          )
        }
      </div>
    </div>
  )
}

export default ContentWrapper
