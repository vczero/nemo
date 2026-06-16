import React, { useMemo } from 'react'

type OutputFormat = 'webp' | 'jpg' | 'png'

export interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string
  w?: number
  h?: number
  q?: number
  radio?: number
  format?: OutputFormat
}

const isOssSrc = (src: string): boolean => {
  if (src.startsWith('/oss-proxy/')) return true
  if (/aliyuncs\.com/i.test(src)) return true
  return false
}

const buildOssProcess = (props: ImageProps): string => {
  const ops: string[] = []

  if (props.w && props.h) {
    if (props.radio) {
      ops.push(`resize,w_${props.w * props.radio},h_${props.h * props.radio}`)
    } else {
      ops.push(`resize,w_${props.w},h_${props.h}`)
    }
  }

  if (props.q !== undefined) {
    ops.push(`quality,q_${Math.max(1, Math.min(100, props.q))}`)
  }

  if (props.format) {
    ops.push(`format,${props.format}`)
  }

  return ops.length > 0 ? `image/interlace,1/${ops.join('/')}` : 'image/interlace,1'
}

const withOssProcess = (src: string, processValue: string): string => {
  if (!processValue) return src
  const [base, hash = ''] = src.split('#')
  const sep = base.includes('?') ? '&' : '?'
  const url = `${base}${sep}x-oss-process=${processValue}`
  return hash ? `${url}#${hash}` : url
}

const Image: React.FC<ImageProps> = ({
  src,
  w,
  h,
  q = 85,
  radio = 2,
  format,
  ...rest
}) => {
  const finalSrc = useMemo(() => {
    if (!src) return src
    if (!isOssSrc(src)) return src

    const processValue = buildOssProcess({
      w,
      h,
      q,
      radio,
      format,
    })
    return withOssProcess(src, processValue)
  }, [src, w, h, q, radio, format])

  return <img src={finalSrc} {...rest} />
}

export default Image
