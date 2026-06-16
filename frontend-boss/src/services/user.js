import request from '../utils/request'

export const login = data => {
  return request({
    url: '/boss/api/user/login',
    method: 'post',
    data,
  })
}

export const logout = () => {
  return request({
    url: '/boss/api/user/logout',
    method: 'post',
  })
}

export const getCurrentUser = () => {
  return request({
    url: '/boss/api/user/current',
    method: 'get',
  })
}

export const getUserList = params => {
  return request({
    url: '/boss/api/user/list',
    method: 'get',
    params,
  })
}

export const createUser = data => {
  return request({
    url: '/boss/api/user/create',
    method: 'post',
    data,
  })
}

export const updateUser = data => {
  return request({
    url: '/boss/api/user/update',
    method: 'post',
    data,
  })
}

// 获取用户详情
export const getUserDetail = userId => {
  return request({
    url: `/boss/api/user/${userId}`,
    method: 'get',
  })
}

// 获取用户账户信息
export const getUserAccount = userId => {
  return request({
    url: `/boss/api/user/${userId}/account`,
    method: 'get',
  })
}

// 获取用户积分统计
export const getPointsStatistics = userId => {
  return request({
    url: `/boss/api/user/${userId}/points/statistics`,
    method: 'get',
  })
}

// 调整用户积分
export const adjustUserPoints = (userId, data) => {
  return request({
    url: `/boss/api/user/${userId}/points/adjust`,
    method: 'post',
    data,
  })
}

// 获取用户积分记录
export const getUserPointsRecords = (userId, params) => {
  return request({
    url: `/boss/api/user/${userId}/points/records`,
    method: 'get',
    params,
  })
}

// 获取用户积分消费明细（支持时间范围筛选）
export const getUserPointsRecordsDetailed = (userId, params) => {
  return request({
    url: `/boss/api/user/${userId}/points/records/detailed`,
    method: 'get',
    params,
  })
}

// ==================== Boss用户关联管理 ====================

// 获取Boss用户关联列表
export const getBossUserRelationList = () => {
  return request({
    url: '/boss/api/user/relation/list',
    method: 'get',
  })
}

// 新增Boss用户关联
export const createBossUserRelation = data => {
  return request({
    url: '/boss/api/user/relation/create',
    method: 'post',
    data,
  })
}

// 更新Boss用户关联
export const updateBossUserRelation = data => {
  return request({
    url: '/boss/api/user/relation/update',
    method: 'post',
    data,
  })
}

// 删除Boss用户关联
export const deleteBossUserRelation = userId => {
  return request({
    url: '/boss/api/user/relation/delete',
    method: 'post',
    params: { userId },
  })
}
