import request from '../utils/request'

export const getPlans = () => {
  return request({
    url: '/boss/api/subscription/plans',
    method: 'get',
  })
}

export const createPlan = (data) => {
  return request({
    url: '/boss/api/subscription/plans',
    method: 'post',
    data,
  })
}

export const updatePlan = (planId, data) => {
  return request({
    url: `/boss/api/subscription/plans/${planId}`,
    method: 'post',
    data,
  })
}

export const setRecommendedPlan = (planId) => {
  return request({
    url: `/boss/api/subscription/plans/${planId}/recommend`,
    method: 'post',
  })
}

export const getProducts = (params) => {
  return request({
    url: '/boss/api/subscription/products',
    method: 'get',
    params,
  })
}

export const createProduct = (data) => {
  return request({
    url: '/boss/api/subscription/products',
    method: 'post',
    data,
  })
}

export const updateProduct = (productId, data) => {
  return request({
    url: `/boss/api/subscription/products/${productId}`,
    method: 'post',
    data,
  })
}

export const updateProductStatus = (productId, isActive) => {
  return request({
    url: `/boss/api/subscription/products/${productId}/${isActive}`,
    method: 'post',
  })
}

export const getSubscriptionFeatures = () => {
  return request({
    url: '/boss/api/subscription/features',
    method: 'get',
  })
}
