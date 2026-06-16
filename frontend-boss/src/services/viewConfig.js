import { getSysctl, saveSysctl } from './systctl'
import request from '../utils/request'

const SYSCTL_KEY = 'VIEW_CONFIG'

export const getViewConfig = async () => {
  const res = await getSysctl(SYSCTL_KEY)
  return res.data ? JSON.parse(res.data) : { banner: { link: '', imageUrl: '' }, menus: [] }
}

export const saveViewConfig = (config) => saveSysctl(SYSCTL_KEY, JSON.stringify(config))

export const getPreviewUrl = (ossPath) => request({ url: `/boss/api/systctl/${SYSCTL_KEY}/preview-url`, method: 'get', params: { ossPath } })
