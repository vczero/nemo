import * as echarts from 'echarts'
import type { ChartConfig } from '@/chart'
import { THEMES } from '@/chart'
import { isColorString } from './utils'

export const isValidConfig = (config: ChartConfig) => {
  return config.type && config.xAxis && config.yAxis
}

declare module 'echarts' {
  interface EChartsType {
    __NAULTILAB_RENDERER__: 'canvas' | 'svg'
  }
}

export const initEcharts = (container: HTMLDivElement, theme?: string, size?: { width: number, height: number }) => {
  if (!container) return null

  theme =
    isColorString(theme) && !THEMES[theme as keyof typeof THEMES]
      ? 'academy'
      : theme
  const chart = echarts.init(container, theme, { renderer: 'svg', width: size?.width, height: size?.height })
  chart.__NAULTILAB_RENDERER__ = 'svg'
  return chart
}

export const createTempChart = (
  chart: echarts.EChartsType,
  renderer: 'svg' | 'canvas'
) => {
  const options = chart.getOption()
  const width = chart.getWidth()
  const height = chart.getHeight()
  const dom = document.createElement('div')
  dom.style.display = 'none'
  document.body.appendChild(dom)
  const tempChart = echarts.init(dom, (options.theme as string) || 'academy', {
    renderer,
    width,
    height,
  })
  tempChart.setOption(options)

  const dispose = () => {
    tempChart.dispose()
    document.body.removeChild(dom)
  }

  return {
    chart,
    dispose,
  }
}

export const svgToPng = (
  svgBase64: Base64URLString,
  pixelRatio = 1
): Promise<Base64URLString> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = svgBase64

    img.onload = () => {
      try {
        const width = img.width
        const height = img.height

        if (width === 0 || height === 0) {
          reject(
            new Error(
              '无法获取 SVG 的尺寸，请确保 SVG 包含 width/height 或 viewBox 属性。'
            )
          )
          return
        }
        const canvas = document.createElement('canvas')

        const scaledWidth = width * pixelRatio
        const scaledHeight = height * pixelRatio

        canvas.width = scaledWidth
        canvas.height = scaledHeight

        const ctx = canvas.getContext('2d')

        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight)
          const pngBase64 = canvas.toDataURL('image/png')
          resolve(pngBase64)
        }
        reject(new Error('无法获取 2D 上下文，请检查浏览器兼容性。'))
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = (_) => {
      reject(new Error('SVG 加载失败，请检查 Base64 格式是否正确。'))
    }
  })
}

export const exportImage = async (
  chart: echarts.EChartsType,
  type: 'png' | 'svg',
  pixelRatio: number = 3
): Promise<Base64URLString> => {
  const rendererType = chart.__NAULTILAB_RENDERER__

  return new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      if (rendererType === 'canvas') {
        if (type === 'svg') {
          const { chart: tempChart, dispose } = createTempChart(chart, 'svg')
          const dataURL = tempChart.getDataURL({
            type: 'svg',
            backgroundColor: '#ffffff',
            pixelRatio: 1,
          })
          dispose()
          return resolve(dataURL)
        }

        if (type === 'png') {
          const dataURL = chart?.getDataURL({
            type: 'png',
            backgroundColor: '#ffffff',
            pixelRatio: pixelRatio,
          })
          return resolve(dataURL)
        }
      }

      if (rendererType === 'svg') {
        const dataURL = chart.getDataURL({
          type: 'svg',
          backgroundColor: '#ffffff',
          pixelRatio: 1,
        })

        if (type === 'svg') {
          return resolve(dataURL)
        }

        if (type === 'png') {
          return svgToPng(dataURL, pixelRatio).then(resolve).catch(reject)
        }
      }

      return reject(new Error('不支持当前图片类型: ' + type))
    })
  })
}

// TODO: more mapping
export const xAxisTypeMap = {
  bar_chart: 'category',
  stacked_bar_chart: 'category',
  line_chart: 'category',
  pie_chart: 'category',
  radar_chart: 'category',
  box_plot: 'category',
  scatter: 'value',
  wordCloud: 'value',
} as const

export const yAxisTypeMap = {
  bar_chart: 'value',
  line_chart: 'value',
  stacked_bar_chart: 'value',
  pie_chart: 'value',
  radar_chart: 'value',
  box_plot: 'value',
  scatter: 'value',
  wordCloud: 'value',
} as const
