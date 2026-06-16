import CryptoJS from 'crypto-js'
import { CRYPTO_KEY } from '@/constants/common'

export const isColorString = (v: unknown) => {
  if (typeof v === 'string')
    return (
      v.startsWith('rgb(') ||
      v.startsWith('rgba(') ||
      v.startsWith('hsl(') ||
      v.startsWith('#')
    )
  if (typeof v === 'object' && v && 'r' in v && 'g' in v && 'b' in v)
    return true
  return false
}

export const encryptData = (data: string) => {
  const aesKey = CryptoJS.enc.Utf8.parse(CRYPTO_KEY)
  const encrypted = CryptoJS.AES.encrypt(data, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

export const passwordVerifier = () => ({
  validator(_: unknown, value: string) {
    if (/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}$/.test(value)) {
      return Promise.resolve()
    }
    return Promise.reject(
      new Error('密码需包含数字, 大小写字母, 长度至少 10 位')
    )
  },
})

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export const generateRandomKey = (length: number = 5) => {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export const downloadFile = (
  fileName: string,
  file: Blob | Base64URLString | string | ArrayBuffer
) => {
  const downloadLink = document.createElement('a')
  downloadLink.download = fileName

  if (file instanceof ArrayBuffer) {
    const blob = new Blob([file], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    downloadLink.href = url
    downloadLink.click()
    URL.revokeObjectURL(url)
  } else {
    const url = typeof file === 'string' ? file : URL.createObjectURL(file)
    downloadLink.href = url
    downloadLink.click()
    URL.revokeObjectURL(url)
  }
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.warn(
        'Navigator Clipboard failed, falling back to legacy method.',
        err
      )
    }
  }

  try {
    const activeElement = document.activeElement as HTMLElement

    const textarea = document.createElement('textarea')
    textarea.value = text

    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'

    document.body.appendChild(textarea)

    textarea.select()
    textarea.setSelectionRange(0, 99999)

    const success = document.execCommand('copy')

    document.body.removeChild(textarea)

    if (activeElement) {
      activeElement.focus()
    }

    return success
  } catch (err) {
    console.error('Copy failed:', err)
    return false
  }
}

export const setLocalStorageItem = <T>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage write failure.
  }
}

export const getLocalStorageItem = <T = undefined>(key: string, fallbackValue?: T): T | undefined => {
  if (typeof window === 'undefined') {
    return fallbackValue
  }

  try {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) {
      return fallbackValue
    }
    return JSON.parse(rawValue) as T
  } catch {
    return fallbackValue
  }
}

export const removeLocalStorageItem = (key: string) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage remove failure.
  }
}

export const isObject = (data: unknown) => {
  return (
    data &&
    typeof data === 'object' &&
    Object.prototype.toString.call(data) === '[object Object]'
  )
}

export const dataURLtoFile = (dataurl: Base64URLString, fileName?: string) => {
  if (!dataurl) return null

  const arr = dataurl.split(',')
  if (arr.length<2) return null

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

const INVITE_CODE_KEY = 'invite_code'
const INVITE_CODE_EXPIRE_DAYS = 30

interface InviteCodeData {
  code: string
  timestamp: number
}

export const clearInviteCode = () => {
  removeLocalStorageItem(INVITE_CODE_KEY)
}

export const saveInviteCode = (code: string) => {
  if (code) {
    const data: InviteCodeData = {
      code,
      timestamp: Date.now()
    }
    setLocalStorageItem(INVITE_CODE_KEY, data)
  }
}

export const getInviteCode = (): string | null => {

  try {
    const stored = getLocalStorageItem<InviteCodeData>(INVITE_CODE_KEY, undefined as any)
    if (!stored) return null

    const expireTime = stored.timestamp + INVITE_CODE_EXPIRE_DAYS * 24 * 60 * 60 * 1000

    if (Date.now() > expireTime) {
      clearInviteCode()
      return null
    }

    return stored.code
  } catch {
    clearInviteCode()
    return null
  }
}

export const getFileName = (fileName?: string) => {
  if (!fileName) return undefined
  const filenameArr = fileName.split('.')
  if (filenameArr.length < 2) return fileName
  return filenameArr.slice(0, -1).join('.')
}

/** 检查 from 参数是否为安全的相对路径 */
export const getSafeFromPath = (from: string | null): string | null => {
  if (!from) return null
  // 必须以 / 开头，且不能是 // 开头（协议相对 URL）
  if (!from.startsWith('/') || from.startsWith('//')) return null
  try {
    // 进一步检查：构造完整 URL，确认 origin 没变
    const url = new URL(from, window.location.origin)
    if (url.origin !== window.location.origin) return null
    return url.pathname + url.search + url.hash
  } catch {
    return null
  }
}

export const formatMoney = (amount: number | string) => {
  return Number.isNaN(Number(amount)) ? '-' : Number(amount).toFixed(2)
}

export const getPathName = (url: string | undefined) => {
  if (!url) return null
  try {
    const urlObj = new URL(url)
    return urlObj.pathname
  } catch {
    return null
  }
}
