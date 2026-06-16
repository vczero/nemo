import { BarChartOutlined } from '@ant-design/icons'
import React from 'react'
import { Link } from 'react-router'
import { Skeleton } from 'antd'

interface ChartCardProps {
  title: string
  subtitle?: string
  link: string
  image?: string
  extra?: React.ReactNode
  loading?: boolean
}

export const ChartCard: React.FC<ChartCardProps> = ({
  link,
  title,
  subtitle,
  image,
  extra,
  loading,
}) => {
  return (
    <div className="group relative flex cursor-pointer flex-col overflow-hidden rounded-none border-0 bg-gray-100 shadow-sm transition-all duration-300 hover:shadow-lg">
      {!loading && extra ? (
        <div className="absolute top-2 right-2 z-10 hidden opacity-0 transition-opacity duration-200 group-hover:block group-hover:opacity-100">
          {extra}
        </div>
      ) : null}
      <Link to={link} className="block">
        <div className="flex aspect-4/3 w-full items-center justify-center overflow-hidden border-b border-gray-100 bg-white p-0 text-gray-300">
          {image ? (
            <img
              src={image}
              alt={title}
              className="pointer-events-none h-full w-full bg-white object-contain"
            />
          ) : (
            <BarChartOutlined className="text-4xl text-gray-300" />
          )}
        </div>

        <div className="flex flex-1 flex-col justify-center bg-gray-100 p-3">
          <Skeleton
            paragraph={{ rows: 1 }}
            styles={{ paragraph: { marginTop: '8px', marginBottom: 0 } }}
            active
            loading={loading}
          >
            <div
              className="mb-1 truncate overflow-hidden font-medium text-ellipsis whitespace-nowrap text-gray-900"
              title={title}
            >
              {title}
            </div>
            <div
              className="overflow-hidden text-xs text-ellipsis whitespace-nowrap text-gray-400"
              title={subtitle}
            >
              {subtitle}
            </div>
          </Skeleton>
        </div>
      </Link>
    </div>
  )
}
