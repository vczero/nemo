/**
 * Value Formatting Utilities
 */

export const formatAxisLabel = (val: any, format?: string): string => {
  if (typeof val !== 'number' || isNaN(val)) return val
  switch (format) {
    case 'percentage':
      return `${val.toFixed(2)}%`
    case 'integer':
      return `${Math.round(val)}`
    case 'cny':
      return `${val.toLocaleString()}`
    case 'usd':
      return `${val.toLocaleString()}`
    case 'decimal':
    default:
      return String(val)
  }
}

/**
 * 根据 format 格式化数值.
 */
export const formatValue = (val: any, format?: string): string => {
  if (typeof val !== 'number' || isNaN(val)) return val

  switch (format) {
    case 'percentage':
      return `${val.toFixed(2)}%`
    case 'integer':
      return `${Math.round(val)}`
    case 'cny':
      return `¥${val.toLocaleString()}`
    case 'usd':
      return `$${val.toLocaleString()}`
    case 'decimal':
    default:
      return String(val)
  }
}

export const dataURLToFile = (dataurl: Base64URLString, fileName?: string) => {
  if (!dataurl) return null

  const arr = dataurl.split(',')
  if (arr.length < 2) return null

  const mime = arr[0].match(/:(.*?);/)?.[1] || ''
  const isBase64 = arr[0].indexOf('base64') !== -1
  let bstr

  const defaultFileName = fileName || `image.${mime.split('/')[1]}`
  if (isBase64) {
    bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    const blob = new Blob([u8arr], { type: mime })
    return new File([blob], defaultFileName, { type: mime })
  } else {
    bstr = decodeURIComponent(arr[1])

    const blob = new Blob([bstr], { type: mime })
    return new File([blob], defaultFileName, { type: mime })
  }
}
