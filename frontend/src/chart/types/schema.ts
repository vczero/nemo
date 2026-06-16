import type { JSONSchemaType } from 'ajv'

// ============================================================
// Data Schema (数据验证)
// ============================================================

export type TDataSchema = JSONSchemaType<Array<object>>

// ============================================================
// Config UI Schema (配置面板 UI 定义)
// ============================================================

/**
 * 配置项控件类型
 */
export type TControlType =
  | 'text'
  | 'number'
  | 'theme'
  | 'slider'
  | 'switch'
  | 'select'
  | 'label'
  | 'legend'
  | 'size'
  | 'color'
  | 'highlightBar'
  | 'imageUpload'
  | 'mapRegionSelect'
  | 'colorFrom'
  | 'gridLayout'

/**
 * 配置项 UI 分组
 */
export type TConfigGroup = 'basic' | 'style' | 'display_element' | 'layout' | 'other'

/**
 * 分组显示标签
 */
export const CONFIG_GROUP_LABELS: Record<TConfigGroup, string> = {
  basic: '基础设置',
  style: '样式设置',
  display_element: '显示元素设置',
  layout: '布局调整',
  other: '其他',
}

/**
 * 分组渲染顺序
 */
export const CONFIG_GROUP_ORDER: TConfigGroup[] = [
  'basic',
  'style',
  'display_element',
  'layout',
  'other',
]

/**
 * 单个配置项定义 (驱动配置面板渲染)
 */
export interface TConfigItem {
  /** 配置路径, 使用点标记法 (如 'xAxis.name.text') */
  key: string
  /** UI 显示标签 */
  label: string
  /** 输入框占位符 */
  placeholder?: string
  /** 控件类型 */
  type: TControlType
  /** 数值范围, 用于 slider/number */
  range?: [number, number] | number[]
  /** 下拉选项, 用于 select */
  options?: { label: string; value: string }[]
  /** 控件属性, 可以用于传递 props 给 Antd 组件 */
  props?: Record<string, unknown>
  /** UI 分组 */
  group: TConfigGroup
}
