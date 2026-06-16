import request from '../utils/request'

export const getComputeEndpoints = (params) => {
  return request({
    url: '/boss/api/compute/endpoints/page',
    method: 'get',
    params,
  })
}

export const getComputeEndpoint = (endpointId) => {
  return request({
    url: `/boss/api/compute/endpoints/${endpointId}`,
    method: 'get',
  })
}

export const createComputeEndpoint = (data) => {
  return request({
    url: '/boss/api/compute/endpoints',
    method: 'post',
    data,
  })
}

export const updateComputeEndpoint = (endpointId, data) => {
  return request({
    url: `/boss/api/compute/endpoints/${endpointId}`,
    method: 'post',
    data,
  })
}

export const updateComputeEndpointStatus = (endpointId, status) => {
  return request({
    url: `/boss/api/compute/endpoints/${endpointId}/status/${status}`,
    method: 'post',
  })
}

export const deleteComputeEndpoint = (endpointId) => {
  return request({
    url: `/boss/api/compute/endpoints/${endpointId}/delete`,
    method: 'post',
  })
}

export const getComputeTypes = () => {
  return request({
    url: '/boss/api/compute/endpoints/compute-types',
    method: 'get',
  })
}
