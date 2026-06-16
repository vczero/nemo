import request from '../utils/request'

export const getInvitationCodePage = data => {
  return request({
    url: '/boss/api/invitation/codes/page',
    method: 'post',
    data,
  })
}

export const getInvitationRecordPage = data => {
  return request({
    url: '/boss/api/invitation/records/page',
    method: 'post',
    data,
  })
}

export const getInvitationStatistics = () => {
  return request({
    url: '/boss/api/invitation/statistics',
    method: 'get',
  })
}
