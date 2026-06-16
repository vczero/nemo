import type {
  CustomSeriesRenderItem,
  CustomSeriesRenderItemParams,
  CustomSeriesRenderItemAPI,
} from 'echarts/types/src/chart/custom/CustomSeries.d.ts'
import type {
  EChartsExtensionInstallRegisters,
  EChartsExtension,
} from 'echarts/types/src/extension.d.ts'

const renderItem = (
  params: CustomSeriesRenderItemParams,
  api: CustomSeriesRenderItemAPI
) => {
  const encode = params.encode
  const payload = (params.itemPayload as any) || {}
  const arrowHeight = payload.arrowHeight ?? 40
  const arrowDepth = payload.arrowDepth ?? 20
  const gap = payload.gap ?? -5

  const paddingLeft = payload.paddingLeft ?? 40
  const paddingRight = payload.paddingRight ?? 40
  const baseFontSize = payload.fontSize ?? 12
  const titleFontSize = baseFontSize + 2

  const index = params.dataIndex
  const totalCount = params.dataInsideLength
  const titleColor = payload.titleColor ?? '#333'
  const subtitleColor = payload.subtitleColor ?? '#888'
  const labelGap = 15

  const title = !isNaN(encode.y[0]) ? (api.value(encode.y[0]) as string) : ''
  const subtitle = !isNaN(encode.y[1]) ? (api.value(encode.y[1]) as string) : ''
  let labelText = !isNaN(encode.y[2]) ? (api.value(encode.y[2]) as string) : ''

  if (labelText == null || labelText === '') {
    labelText = String(index + 1).padStart(2, '0')
  }

  const color = api.visual('color')

  const canvasWidth = api.getWidth()
  const canvasHeight = api.getHeight()

  const availableWidth = canvasWidth - paddingLeft - paddingRight
  const categoryWidth = availableWidth / totalCount
  const arrowWidth = categoryWidth - gap

  const centerX = paddingLeft + index * categoryWidth + categoryWidth / 2
  const centerY = payload.yCenter ?? canvasHeight / 2

  const xLeft = centerX - arrowWidth / 2
  const xRight = centerX + arrowWidth / 2
  const yTop = centerY - arrowHeight / 2
  const yBottom = centerY + arrowHeight / 2

  const points = []
  points.push([xLeft, yTop])
  points.push([xRight - arrowDepth, yTop])
  points.push([xRight, centerY])
  points.push([xRight - arrowDepth, yBottom])
  points.push([xLeft, yBottom])
  if (index > 0) {
    points.push([xLeft + arrowDepth, centerY])
  }

  const isTop = index % 2 === 0
  const labelY = isTop ? yTop - labelGap : yBottom + labelGap
  const labelVAlign = isTop ? 'bottom' : 'top'

  // 为了不让文字太贴近前后的箭头，我们给文字宽度设置一个小小的安全边距 (padding)
  const textSafeWidth = categoryWidth
  let formattedOuterText = ''

  if (isTop) {
    const parts = []
    if (title) parts.push(`{titleStyle|${title}\n\n}`)
    if (subtitle) parts.push(`{subtitleStyle|${subtitle}}`)
    formattedOuterText = parts.join('\n')
  } else {
    const parts = []
    if (title) parts.push(`{titleStyle|${title}\n\n}`)
    if (subtitle) parts.push(`{subtitleStyle|${subtitle}}`)
    formattedOuterText = parts.join('\n')
  }

  return {
    type: 'group',
    silent: true,
    children: [
      {
        type: 'polygon',
        shape: { points: points },
        style: { fill: color, lineJoin: 'round', lineWidth: 2, stroke: color },
      },
      {
        type: 'text',
        x: centerX + (index === 0 ? 0 : arrowDepth / 4),
        y: centerY,
        style: {
          text: labelText,
          fill: '#fff',
          fontSize: baseFontSize, // 👈 内部 label 使用基础字号
          fontWeight: 'bold',
          align: 'center',
          verticalAlign: 'middle',
        },
      },
      {
        type: 'text',
        x: centerX + (index === 0 ? 0 : arrowDepth / 4),
        y: labelY,
        style: {
          text: formattedOuterText,
          align: 'center',
          verticalAlign: labelVAlign, // 👈 使用动态的垂直对齐方式
          width: textSafeWidth, // 👈 核心：限制文本块的最大宽度
          overflow: 'break', // 👈 核心：超出宽度自动折行
          rich: {
            titleStyle: {
              fontSize: titleFontSize, // 👈 title 放大 +2
              fontWeight: 'bold', // 👈 title 保持加粗
              fill: titleColor, // 👈 title 颜色深
              lineHeight: titleFontSize + 6,
            },
            subtitleStyle: {
              fontSize: baseFontSize, // 👈 subtitle 使用基础字号
              fontWeight: 'normal', // 👈 subtitle 普通字重 (不加粗)
              fill: subtitleColor, // 👈 subtitle 颜色变淡
              lineHeight: baseFontSize + 6,
            },
          },
        },
      },
    ],
  }
}

export default {
  install(registers: EChartsExtensionInstallRegisters) {
    registers.registerCustomSeries(
      'timeline',
      renderItem as unknown as CustomSeriesRenderItem
    )
  },
} as EChartsExtension
