import request from '../utils/request'

// 协议类型枚举
export const AgreementType = {
  USER_AGREEMENT: 'USER_AGREEMENT',
  PRIVACY_POLICY: 'PRIVACY_POLICY',
  SERVICE_AGREEMENT: 'SERVICE_AGREEMENT',
}

// 协议类型映射
export const AgreementTypeMap = {
  USER_AGREEMENT: '用户协议',
  PRIVACY_POLICY: '隐私政策',
  SERVICE_AGREEMENT: '产品服务协议',
}

// 分页查询协议列表
export const getAgreementPage = data => {
  return request({
    url: '/boss/api/agreements/page',
    method: 'post',
    data,
  })
}

// 获取协议详情
export const getAgreementDetail = agreementId => {
  return request({
    url: '/boss/api/agreements/detail',
    method: 'get',
    params: { agreementId },
  })
}

// 创建协议
export const createAgreement = data => {
  return request({
    url: '/boss/api/agreements/create',
    method: 'post',
    data,
  })
}

// 激活协议
export const activateAgreement = data => {
  return request({
    url: '/boss/api/agreements/activate',
    method: 'post',
    params: data,
  })
}

// 删除协议
export const deleteAgreement = agreementId => {
  return request({
    url: '/boss/api/agreements/delete',
    method: 'post',
    params: { agreementId },
  })
}

// 分页查询用户协议授权记录
export const getUserAgreementPage = data => {
  return request({
    url: '/boss/api/agreements/user-agreements/page',
    method: 'post',
    data,
  })
}
