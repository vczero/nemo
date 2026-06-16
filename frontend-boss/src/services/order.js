import request from '../utils/request'

// 获取订单列表
export const getOrderList = params => {
  return request({
    url: '/boss/api/orders',
    method: 'get',
    params,
  })
}

// 获取订单详情
export const getOrderDetail = orderId => {
  return request({
    url: `/boss/api/orders/${orderId}`,
    method: 'get',
  })
}

// 获取订单状态统计
export const getOrderStatistics = () => {
  return request({
    url: '/boss/api/orders/statistics',
    method: 'get',
  })
}

// 获取用户列表（用于筛选）
export const getUserOptions = params => {
  return request({
    url: '/boss/api/user/list',
    method: 'get',
    params: {
      ...params,
      pageSize: 100, // 下拉选择不需要分页
    },
  })
}

// 获取产品列表（用于筛选）
export const getProductOptions = () => {
  return request({
    url: '/boss/api/subscription/products',
    method: 'get',
  })
}

// 获取套餐列表（用于筛选）
export const getPlanOptions = () => {
  return request({
    url: '/boss/api/subscription/plans',
    method: 'get',
  })
}

// 导出订单
export const exportOrders = params => {
  return request({
    url: '/boss/api/orders/export',
    method: 'get',
    params,
    responseType: 'blob',
  })
}

// 创建订单（后台开单）
export const createOrder = data => {
  return request({
    url: '/boss/api/orders/create',
    method: 'post',
    data,
  })
}

// 标记订单为支付完成（调试用）
export const finishOrder = orderId => {
  return request({
    url: `/boss/api/orders/${orderId}/finish`,
    method: 'post',
  })
}