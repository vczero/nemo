import request from '../utils/request'

export const getAlipayConfig = () => {
  return request({
    url: '/boss/api/payments/alipay',
    method: 'get',
  })
}

export const saveAlipayConfig = data => {
  return request({
    url: '/boss/api/payments/alipay',
    method: 'post',
    data,
  })
}

export const getWechatConfig = () => {
  return request({
    url: '/boss/api/payments/wechat',
    method: 'get',
  })
}

export const saveWechatConfig = data => {
  return request({
    url: '/boss/api/payments/wechat',
    method: 'post',
    data,
  })
}
