import { useState, useMemo, useEffect } from 'react'
import {
  Button,
  Collapse,
  ColorPicker,
  Divider,
  Input,
  InputNumber,
  Select,
  Switch,
  Table,
  Upload,
  Tag,
  App,
} from 'antd'
import { useSearchParams, Link } from 'react-router'
import type { UploadChangeParam } from 'antd/es/upload'
import {
  FileTextOutlined,
  UploadOutlined,
  PlusOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { useShallow } from 'zustand/react/shallow'
import isEqual from 'fast-deep-equal/es6'
import {
  useEditorStore,
  selectColumns,
  selectIsDemo,
  selectHasData,
  selectChartDefinition,
  selectChartDataMapping,
} from '@/chart'
// import { suggestStackBy } from '@/chart/utils'

import type { ChartConfig, MetricField, DataMappingFieldMeta } from '@/chart'
import type { ChartDefinition } from '@/chart/types/definition'
import type { DeepPartial } from '@/chart/core/types'
import { uploadChartDataFile, replaceChartDataFile } from '@/apis'
import { parseFileToTable, tableToXLSX } from '@/utils/xlsx'
import Permission, { usePermission } from '@/components/Permission'
import { PERMISSIONS } from '@/constants/permission'

// ============================================================
// Generic field renderers
// ============================================================

/**
 * 单列选择器 (dimension, nameField, valueField, stackBy, etc.)
 */
function SingleFieldRenderer({
  fieldMeta,
  value,
  columnOptions,
  onChange,
}: {
  fieldMeta: DataMappingFieldMeta
  value: string | undefined
  columnOptions: { label: string; value: string }[]
  onChange: (value: string) => void
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs text-gray-500">
        {fieldMeta.label}
        {!fieldMeta.required && (
          <span className="ml-1 text-gray-300">(可选)</span>
        )}
      </label>
      <Select
        className="w-full"
        placeholder={`选择${fieldMeta.label}`}
        value={value || undefined}
        onChange={onChange}
        options={columnOptions}
        allowClear={!fieldMeta.required}
      />
    </div>
  )
}

/**
 * 多列选择器 (metrics — MetricField[])
 */
function MultipleFieldRenderer({
  fieldMeta,
  value,
  maxFields,
  columnOptions,
  onChange,
}: {
  fieldMeta: DataMappingFieldMeta
  value: MetricField[]
  maxFields?: number
  columnOptions: { label: string; value: string }[]
  onChange: (value: MetricField[]) => void
}) {
  const handleAdd = () => {
    onChange([...value, { field: '' }])
  }

  const handleFieldChange = (index: number, field: string) => {
    const newItems = [...value]
    newItems[index] = { ...newItems[index], field, alias: field }
    onChange(newItems)
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleAliasChange = (index: number, alias: string) => {
    const newItems = [...value]
    newItems[index] = { ...newItems[index], alias: alias || undefined }
    onChange(newItems)
  }

  const handleStackChange = (index: number, stack: string) => {
    const newItems = [...value]
    newItems[index] = { ...newItems[index], stack: stack || undefined }
    onChange(newItems)
  }

  const handleShowBackgroundChange = (index: number, checked: boolean) => {
    const newItems = [...value]
    newItems[index] = { ...newItems[index], showBackground: checked }
    onChange(newItems)
  }

  const handleBackgroundColorChange = (index: number, color: string) => {
    const newItems = [...value]
    newItems[index] = {
      ...newItems[index],
      backgroundColor: color || undefined,
    }
    onChange(newItems)
  }

  const handleExtraChange = (index: number, key: string, val: any) => {
    const newItems = [...value]
    newItems[index] = { ...newItems[index], [key]: val ?? undefined }
    onChange(newItems)
  }

  return (
    <div className="mb-2">
      <label className="mb-1 block text-xs text-gray-500">
        {fieldMeta.label}
      </label>
      {value.map((metric, index) => (
        <div key={index} className="mb-2 rounded border border-gray-200 p-2">
          <div className="flex items-center gap-1">
            <Select
              className="flex-1"
              placeholder="选择列"
              value={metric.field || undefined}
              onChange={(val) => handleFieldChange(index, val)}
              options={columnOptions}
            />
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => handleRemove(index)}
            />
          </div>
          {fieldMeta.showAlias && (
            <div className="mt-1">
              <Input
                size="small"
                placeholder="别名 (图例显示名)"
                value={metric.alias ?? ''}
                onChange={(e) => handleAliasChange(index, e.target.value)}
              />
            </div>
          )}
          {fieldMeta.extras?.map((extra, idx) => (
            <div key={extra.key ?? idx} className="mt-1">
              {extra.label && (
                <span className="mr-2 text-xs text-gray-500">
                  {extra.label}
                </span>
              )}
              {extra.type === 'number' && (
                <InputNumber
                  size="small"
                  {...extra.props}
                  value={metric[extra.key] as number}
                  onChange={(val) => handleExtraChange(index, extra.key, val)}
                />
              )}
              {extra.type === 'text' && (
                <Input
                  size="small"
                  {...extra.props}
                  value={(metric[extra.key] as string) ?? ''}
                  onChange={(e) =>
                    handleExtraChange(index, extra.key, e.target.value)
                  }
                />
              )}
              {/* Add other types as needed */}
            </div>
          ))}
          {fieldMeta.showStack && (
            <div className="mt-1">
              <Input
                size="small"
                placeholder="堆叠组名 (必填, 如: total)"
                value={metric.stack ?? ''}
                onChange={(e) => handleStackChange(index, e.target.value)}
              />
            </div>
          )}
          {fieldMeta.showBackground && (
            <div className="line-height-[24px] mt-1 flex h-[24px] items-center gap-2">
              <span className="text-xs text-gray-400">柱子背景</span>
              <Switch
                size="small"
                checked={metric.showBackground ?? false}
                onChange={(checked) =>
                  handleShowBackgroundChange(index, checked)
                }
              />
              {metric.showBackground && (
                <ColorPicker
                  size="small"
                  value={metric.backgroundColor || 'rgba(180, 180, 180, 0.2)'}
                  onChange={(_, hex) => handleBackgroundColorChange(index, hex)}
                  showText
                />
              )}
            </div>
          )}
        </div>
      ))}
      <Button
        type="dashed"
        size="small"
        block
        icon={<PlusOutlined />}
        onClick={handleAdd}
        disabled={maxFields ? value.length >= maxFields : false}
      >
        添加{fieldMeta.label.replace(/\s*\(.*\)/, '')}
      </Button>
    </div>
  )
}

// ============================================================
// Data Requirement Hint (数据要求 & 示例数据)
// ============================================================

const FIELD_TYPE_LABEL: Record<string, string> = {
  single: '可选择一列',
  multiple: '可选择多列',
}

function DataRequirementHint({
  chartDef,
  currentChartId,
}: {
  chartDef: ChartDefinition
  currentChartId: string | null
}) {
  const demoData = (
    chartDef.demos.find((demo) => demo.chartId === currentChartId) ||
    chartDef.demos[0]
  )?.chartFile?.content
  const header =
    demoData && demoData.length > 0 ? (demoData[0] as string[]) : []
  const previewDataRows = demoData?.slice(1, 6) ?? [] // Slice data rows

  const tableColumns = useMemo(() => {
    if (!header.length) return []
    return header.map((key, idx) => ({
      title: key,
      dataIndex: idx, // Use index for array data
      key: idx,
      ellipsis: true,
      width: 100,
    }))
  }, [header])

  const handleDownloadDemo = () => {
    if (!demoData?.length) return
    const xlsxBlob = tableToXLSX(demoData)
    const url = URL.createObjectURL(xlsxBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${chartDef.name}_示例数据.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Collapse
      size="small"
      bordered={false}
      className="mt-2 bg-transparent"
      styles={{
        icon: { marginLeft: '0px' },
        header: { padding: 0 },
        title: { padding: 0 },
        body: { padding: '2px' },
      }}
      items={[
        {
          key: 'hint',
          label: (
            <span className="text-xs">
              <InfoCircleOutlined className="mr-1" />
              查看数据要求与示例
            </span>
          ),
          children: (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">{chartDef.description}</p>
              <div className="my-4 rounded-sm border border-gray-200 bg-gray-50 p-2">
                <div className="mb-1 flex items-center text-xs font-medium text-gray-700">
                  数据映射配置说明
                </div>
                <ul className="space-y-1">
                  {chartDef.dataMappingMeta?.fields &&
                    chartDef.dataMappingMeta.fields.map((field) => (
                      <li key={field.key} className="text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-gray-600">{field.label}</span>
                            {field.required && (
                              <span className="ml-1 leading-none text-red-500">
                                *
                              </span>
                            )}
                          </div>
                          <div className="rounded-sm border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-500 shadow-sm">
                            {FIELD_TYPE_LABEL[field.fieldType] ??
                              field.fieldType}
                          </div>
                        </div>
                        {field.description && (
                          <div className="break-all text-gray-400">
                            描述：{field.description}
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
              {previewDataRows.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium text-gray-600">
                    示例数据 (前 {previewDataRows.length} 行, 共{' '}
                    {demoData!.length} 行)
                  </div>
                  <Table
                    size="small"
                    dataSource={previewDataRows} // Pass 2D array (without header)
                    columns={tableColumns as any}
                    rowKey={(_, index) => String(index)}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                    className="text-xs"
                  />
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    className="mt-1 p-0 text-xs"
                    onClick={handleDownloadDemo}
                  >
                    下载示例数据 (XLSX)
                  </Button>
                </div>
              )}
            </div>
          ),
        },
      ]}
    />
  )
}

// ============================================================
// Demo Selector
// ============================================================

function DemoSelector({
  chartDef,
  currentChartId,
}: {
  chartDef: ChartDefinition
  currentChartId: string | null
}) {
  // Filter out the current demo if you only want to show *other* demos,
  // or show all and highlight the current one.
  // Showing all is usually better for context.
  if (!chartDef.demos || chartDef.demos.length === 0) return null

  return (
    <div className="mt-3">
      <div className="mb-2 text-xs font-bold text-gray-500">示例图表</div>
      <div className="flex flex-wrap gap-2">
        {chartDef.demos.map((demo) => {
          const isActive = demo.chartId === currentChartId

          if (isActive) {
            return (
              <div
                key={demo.chartId}
                className="cursor-default rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600"
              >
                {demo.chartName || '未命名示例'}
              </div>
            )
          }

          return (
            <Link
              key={demo.chartId}
              to={`?id=${demo.chartId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block cursor-pointer rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 no-underline transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              {demo.chartName || '未命名示例'}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// DataPanel
// ============================================================

export default function DataPanel({ onEditData }: { onEditData: () => void }) {
  const { message } = App.useApp()
  const chartId = useEditorStore((s) => s.chartId)
  const chartName = useEditorStore((s) => s.chartName)
  const dataMapping = useEditorStore(selectChartDataMapping)
  const chartData = useEditorStore(useShallow((s) => s.chartData))
  const chartFileName = useEditorStore((s) => s.chartFileName)
  const chartFileUrl = useEditorStore((s) => s.chartFileUrl)
  const chartFileId = useEditorStore((s) => s.chartFileId)
  const updateChartName = useEditorStore((s) => s.updateChartName)
  const updateConfig = useEditorStore((s) => s.updateConfig)
  const createNewChart = useEditorStore((s) => s.createNewChart)
  const replaceDataFile = useEditorStore((s) => s.replaceDataFile)
  const columns = useEditorStore(useShallow(selectColumns))
  const chartDef = useEditorStore(selectChartDefinition)
  const isDemo = useEditorStore(selectIsDemo)
  const hasData = useEditorStore(selectHasData)
  const [, setSearchParams] = useSearchParams()
  const permission = isDemo
    ? [PERMISSIONS.CHART_VIEW_DEMO, PERMISSIONS.CHART_EDIT_DEMO]
    : [PERMISSIONS.CHART_VIEW, PERMISSIONS.CHART_EDIT, PERMISSIONS.CHART_NEW]

  const { guard: permissionGuard } = usePermission(permission)

  const [isUploading, setIsUploading] = useState(false)

  const dataMappingMeta = chartDef?.dataMappingMeta

  const [localDataMapping, setLocalDataMapping] = useState<Record<
    string,
    unknown
  > | null>(dataMapping)

  // 当 store 的 dataMapping 被外部更新时 (初始加载、替换文件等), 同步到 local state
  useEffect(() => {
    if (isEqual(dataMapping, localDataMapping)) {
      return
    }
    setLocalDataMapping(dataMapping)
  }, [dataMapping])

  const columnOptions = useMemo(
    () => columns.map((col: string) => ({ label: col, value: col })),
    [columns]
  )

  const handleUpdateName = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!permissionGuard()) {
      return
    }
    updateChartName(e.target.value)
  }

  const handleSingleFieldChange = (fieldKey: string, value: string) => {
    if (!permissionGuard()) {
      return
    }
    const newMapping = { ...localDataMapping, [fieldKey]: value }
    setLocalDataMapping(newMapping)
    updateConfig({ dataMapping: newMapping } as DeepPartial<ChartConfig>)
  }

  const handleMultipleFieldChange = (
    fieldKey: string,
    value: MetricField[]
  ) => {
    if (!permissionGuard()) {
      return
    }
    const newMapping = { ...localDataMapping, [fieldKey]: value }
    setLocalDataMapping(newMapping)
    updateConfig({ dataMapping: newMapping } as DeepPartial<ChartConfig>)
  }

  const beforeUpload = async (file: File) => {
    try {
      if (file.size / 1024 / 1024 > 10) {
        message.error('文件大小不能超过 10MB!')
        return Upload.LIST_IGNORE
      }
      const data = await parseFileToTable(file)
      if (data.length > 50000) {
        message.error('数据量不能超过 50000 条!')
        return Upload.LIST_IGNORE
      }
      return file
    } catch (error: any) {
      message.error(`文件解析失败: ${error.message}`)
      return Upload.LIST_IGNORE
    }
  }

  const handleUploadChange =
    (uploadType: 'new' | 'replace') => async (info: UploadChangeParam) => {
      if (info.file.status === 'uploading') {
        setIsUploading(true)
      }
      if (info.file.status === 'done') {
        setIsUploading(false)
        message.success(`${info.file.name} 上传成功`)
        const fileObj = {
          originFileObj: info.file.originFileObj as File,
          response: info.file.response,
        }
        if (uploadType === 'new') {
          const chartId = await createNewChart(fileObj)
          setSearchParams({ id: chartId }, { replace: true })
        } else {
          await replaceDataFile(fileObj)
        }
      }
      if (info.file.status === 'error') {
        setIsUploading(false)
        message.error(`${info.file.name} 上传失败`)
      }
    }

  const uploadFile =
    (uploadType: 'new' | 'replace') =>
    async (
      opts: Parameters<
        NonNullable<import('antd/es/upload').UploadProps['customRequest']>
      >[0]
    ) => {
      try {
        if (uploadType === 'new') {
          const response = await uploadChartDataFile({
            file: opts.file as File,
          })
          opts.onSuccess?.(response)
        } else {
          if (!chartFileId) {
            throw new Error('chartFileId is not found')
          }
          const response = await replaceChartDataFile({
            file: opts.file as File,
            fileId: chartFileId,
          })
          opts.onSuccess?.(response)
        }
      } catch (error) {
        opts.onError?.(error as Error)
      }
    }

  const showUpload = !hasData || isDemo

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex h-[45px] items-center border-b border-gray-200 px-2 text-lg leading-[45px] font-bold">
        <FileTextOutlined className="mr-2" /> 数据管理
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <h3 className="mb-2 font-bold">数据源</h3>
          {showUpload ? (
            <Permission permission={[PERMISSIONS.CHART_NEW]} mode="Alert">
              <Upload.Dragger
                beforeUpload={beforeUpload}
                accept=".xls,.xlsx"
                maxCount={1}
                disabled={isUploading}
                customRequest={uploadFile('new')}
                onChange={handleUploadChange('new')}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽上传</p>
                <p className="ant-upload-hint text-xs text-gray-400">
                  支持 Excel 文件（.xls, .xlsx 后缀）
                </p>
              </Upload.Dragger>
            </Permission>
          ) : (
            <div className="space-y-2">
              {chartFileName && chartFileUrl && (
                <div className="truncate text-xs text-gray-400">
                  <a
                    href={chartFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <DownloadOutlined /> {chartFileName}
                  </a>
                </div>
              )}
              <Permission permission={permission} mode="Alert">
                <div className="flex gap-2">
                  <Button
                    size="small"
                    className="flex-1"
                    onClick={onEditData}
                    icon={<EditOutlined />}
                  >
                    编辑数据
                  </Button>
                  <Upload
                    className="flex-1 *:w-full"
                    beforeUpload={beforeUpload}
                    accept=".xls,.xlsx"
                    maxCount={1}
                    disabled={isUploading}
                    customRequest={uploadFile('replace')}
                    onChange={handleUploadChange('replace')}
                    showUploadList={false}
                  >
                    <Button
                      size="small"
                      className="w-full"
                      icon={<UploadOutlined />}
                      loading={isUploading}
                    >
                      上传文件
                    </Button>
                  </Upload>
                </div>
              </Permission>
              <Tag color="green">
                {chartData?.length ?? 0} 条数据, {columns.length} 列
              </Tag>
            </div>
          )}

          {chartDef && (
            <DemoSelector chartDef={chartDef} currentChartId={chartId} />
          )}

          {chartDef && (
            <DataRequirementHint chartDef={chartDef} currentChartId={chartId} />
          )}
        </div>

        <Divider className="m-0" />

        <div className="p-2">
          <h3 className="mb-2 font-bold">基本信息</h3>
          <div className="mb-2">
            <label className="mb-1 block text-xs text-gray-500">图表名称</label>
            <Input
              placeholder="请输入图表名称"
              value={chartName}
              onChange={handleUpdateName}
            />
          </div>
        </div>

        {hasData && dataMappingMeta && dataMappingMeta.fields.length > 0 && (
          <>
            <Divider className="m-0" />
            <div className="p-2">
              <h3 className="mb-2 font-bold">数据映射</h3>
              <Permission permission={permission} mode="Alert">
                {dataMappingMeta.fields.map((fieldMeta) => {
                  if (fieldMeta.fieldType === 'single') {
                    return (
                      <SingleFieldRenderer
                        key={fieldMeta.key}
                        fieldMeta={fieldMeta}
                        value={
                          localDataMapping?.[fieldMeta.key] as
                            | string
                            | undefined
                        }
                        columnOptions={columnOptions}
                        onChange={(val) =>
                          handleSingleFieldChange(fieldMeta.key, val)
                        }
                      />
                    )
                  }

                  if (fieldMeta.fieldType === 'multiple') {
                    return (
                      <MultipleFieldRenderer
                        key={fieldMeta.key}
                        fieldMeta={fieldMeta}
                        maxFields={fieldMeta.maxFields}
                        value={
                          (localDataMapping?.[
                            fieldMeta.key
                          ] as MetricField[]) ?? []
                        }
                        columnOptions={columnOptions}
                        onChange={(val) =>
                          handleMultipleFieldChange(fieldMeta.key, val)
                        }
                      />
                    )
                  }

                  return null
                })}
              </Permission>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
