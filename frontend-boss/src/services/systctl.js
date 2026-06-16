import request from '../utils/request'

// 获取系统配置
export const getSysctl = (key) => {
  return request({
    url: `/boss/api/systctl/${key}`,
    method: 'get',
  })
}

// 保存系统配置
export const saveSysctl = (key, value) => {
  return request({
    url: `/boss/api/systctl/${key}`,
    method: 'post',
    data: { value },
  })
}
