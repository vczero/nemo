import request from '../utils/request'

// 获取渠道订单列表
export const getChannelOrderList = params => {
  return request({
    url: '/boss/api/channel-orders',
    method: 'get',
    params,
  })
}

// 获取渠道订单详情
export const getChannelOrderDetail = orderId => {
  return request({
    url: `/boss/api/channel-orders/${orderId}`,
    method: 'get',
  })
}

// 创建渠道订单
export const createChannelOrder = data => {
  return request({
    url: '/boss/api/channel-orders',
    method: 'post',
    data,
  })
}

// 获取套餐列表
export const getPlanOptions = () => {
  return request({
    url: '/boss/api/subscription/plans',
    method: 'get',
  })
}
