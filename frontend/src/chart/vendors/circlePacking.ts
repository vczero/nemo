import * as d3 from 'd3-hierarchy'
import type {
  CustomSeriesRenderItem,
  CustomSeriesRenderItemParams,
  CustomSeriesRenderItemAPI,
} from 'echarts/types/src/chart/custom/CustomSeries.d.ts'
import type {
  EChartsExtensionInstallRegisters,
  EChartsExtension,
} from 'echarts/types/src/extension.d.ts'

import{generateLighterColors} from '../utils'

function parsePercent(
  value: string | number | undefined,
  total: number,
  defaultValue: number
): number {
  if (value === undefined) return defaultValue
  if (typeof value === 'string') {
    if (value.endsWith('%')) {
      return (parseFloat(value) / 100) * total
    }
    return parseFloat(value)
  }
  return value
}

const renderItem = (
  params: CustomSeriesRenderItemParams,
  api: CustomSeriesRenderItemAPI
) => {
  const context = params.context
  const width = api.getWidth()
  const height = api.getHeight()
  const payload = (params.itemPayload as any) || {}
  const grid = payload.grid || {}
  const labelColor = payload.labelColor || '#fff'
  console.log('labelColor', labelColor)
  const top = parsePercent(grid.top, height, 0)
  const bottom = parsePercent(grid.bottom, height, 0)
  const left = parsePercent(grid.left, width, 0)
  const right = parsePercent(grid.right, width, 0)

  const chartWidth = Math.max(width - left - right, 0)
  const chartHeight = Math.max(height - top - bottom, 0)

  // Only do layout once per render cycle
  if (!context.layout) {
    context.layout = true
    context.nodes = {}
    context.colors = generateLighterColors(api.visual('color') as string, 5, 0.95, true) as string[]

    const list: any[] = []
    const count = params.dataInsideLength

    // Reconstruct data list from API
    // We assume data structure: [id, parentId, value, name]
    // Indices: 0:id, 1:parentId, 2:value, 3:name
    for (let i = 0; i < count; i++) {
      const id = api.value(0, i)
      const parentId = api.value(1, i)
      const value = api.value(2, i)
      const name = api.value(3, i)

      list.push({
        id: String(id),
        parentId: parentId ? String(parentId) : undefined,
        value: value || i,
        name: name,
        index: i, // Store original index to map back
      })
    }

    if (list.length > 0) {
      try {
        const root = d3
          .stratify<any>()
          .id((d) => d.id)
          .parentId((d) => d.parentId)(list)

        root.sum((d) => d.value)
        root.sort((a, b) => (b.value!) - (a.value!))

        d3.pack().size([chartWidth, chartHeight]).padding(3)(root)

        root.descendants().forEach((node) => {
          if (node.data.index !== undefined) {
            (context.nodes as any)[node.data.index] = node as unknown as d3.HierarchyNode<any>
          }
        })
      } catch (e) {
        console.warn('Circle Packing Layout Failed:', e)
      }
    }
  }

  const node = context.nodes ? (context.nodes as any)[params.dataIndexInside] : null
  if (!node) return

  const isLeaf = !node.children || !node.children.length

  const colorIndex = Math.min(node.depth, 5)
  const color = (context.colors as string[])[colorIndex]

  const userFontSize = payload.fontSize || 12
  // Scale font size based on node radius and user setting.
  // When userFontSize is 12, fontSize is approx node.r * 0.3
  const fontSize = node.r * (userFontSize / 40)

  return {
    type: 'circle',
    silent: true,
    transition: ['shape'],
    z2: node.depth * 2,
    shape: {
      cx: node.x + left,
      cy: node.y + top,
      r: node.r,
    },
    style: {
      fill: color,
    },
    textContent: {
      type: 'text',
      style: {
        text: isLeaf ? node.data.name : '',
        fill: labelColor,
        fontFamily: 'Arial',
        width: node.r * 1.6,
        overflow: 'truncate',
        align: 'center',
        verticalAlign: 'middle',
        fontSize: fontSize,
      },
    },
    textConfig: {
      position: 'inside',
    },
  }
}

export default {
  install(registers: EChartsExtensionInstallRegisters) {
    registers.registerCustomSeries(
      'circle_packing',
      renderItem as unknown as CustomSeriesRenderItem
    )
  },
} as EChartsExtension
