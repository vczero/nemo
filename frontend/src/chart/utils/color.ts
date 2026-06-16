/**
 * Color Utilities
 *
 * 颜色解析、转换、渐变生成工具函数.
 */

export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return hex

  let c: any
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('')
    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }
    c = '0x' + c.join('')
    return (
      'rgba(' +
      [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') +
      ',' +
      alpha +
      ')'
    )
  }
  return hex
}

/**
 * 将任意常见颜色字符串解析为 RGB 数组
 * 支持格式: "#FFF", "#FFFFFF", "rgb(255,0,0)", "rgba(255,0,0,0.5)"
 */
export function parseColorToRgb(color: string): [number, number, number] {
  let r, g, b

  // 处理 Hex 格式
  if (color.startsWith('#')) {
    let hex = color.replace('#', '')
    if (hex.length === 3) {
      // 处理简写，如 #FFF -> #FFFFFF
      hex = hex
        .split('')
        .map((char) => char + char)
        .join('')
    }
    const intVal = parseInt(hex, 16)
    r = (intVal >> 16) & 255
    g = (intVal >> 8) & 255
    b = intVal & 255
  }
  // 处理 rgb() 或 rgba() 格式
  else if (color.startsWith('rgb')) {
    const values = color.match(/\d+(\.\d+)?/g) // 提取所有数字
    r = parseInt(values?.[0] || '0')
    g = parseInt(values?.[1] || '0')
    b = parseInt(values?.[2] || '0')
  } else {
    throw new Error('不支持的颜色格式。请使用 Hex 或 rgb/rgba。')
  }

  return [r, g, b]
}

/**
 * 将 RGB 转换为 HSL
 */
export function rgbToHsl(
  r: number,
  g: number,
  b: number
): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max === min) {
    h = s = 0 // 灰色
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [h * 360, s, l]
}

/**
 * 将 HSL 转换为 Hex 字符串
 */
export function hslToHex(h: number, s: number, l: number) {
  h /= 360
  let r, g, b

  if (s === 0) {
    r = g = b = l // 灰色
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = parseColorToRgb(c1)
  const [r2, g2, b2] = parseColorToRgb(c2)

  const r = Math.round(r1 + (r2 - r1) * t),
    g = Math.round(g1 + (g2 - g1) * t),
    b = Math.round(b1 + (b2 - b1) * t)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function makeColorFn(min: number, max: number, colors: string[]) {
  return (val: number | null) => {
    if (val == null || isNaN(val as number)) return '#f5f5f5'
    if (max === min) return colors[0]
    const t = Math.max(0, Math.min(1, (val - min) / (max - min)))
    const idx = t * (colors.length - 1)
    const lo = Math.floor(idx)
    const hi = Math.min(lo + 1, colors.length - 1)

    return lerpColor(colors[lo], colors[hi], idx - lo)
  }
}

/**
 * 生成渐变变亮的颜色数组
 * @param {string} colorInput - 输入的颜色字符串
 * @param {number} steps - 最终返回的颜色总数量 (默认 5)
 * @param {number} maxLightness - 允许的最大亮度 (0-1，默认 0.95 避免纯白看不见)
 * @param {boolean} reverse - 控制亮度顺序。true: 亮度高的排在后面；false: 亮度高的排在前面 (默认 false)
 * @returns {string[]} 包含变亮后 Hex 颜色的数组
 */
export function generateLighterColors(
  colorInput: string,
  steps = 5,
  maxLightness = 0.95,
  reverse = false
) {
  const [r, g, b] = parseColorToRgb(colorInput)
  let [h, s, l] = rgbToHsl(r, g, b)

  const lighterColors: string[] = []

  const targetLightness = Math.max(l, maxLightness)
  const lightnessStep = steps > 1 ? (targetLightness - l) / (steps - 1) : 0

  for (let i = 0; i < steps; i++) {
    const newL = Math.min(1, l + lightnessStep * i)
    lighterColors.push(hslToHex(h, s, newL))
  }

  return reverse ? lighterColors : lighterColors.reverse()
}
