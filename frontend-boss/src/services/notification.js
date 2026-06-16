import request from '../utils/request'

// 分页查询系统通知列表
export const getNotificationPage = data => {
  return request({
    url: '/boss/api/notifications/page',
    method: 'post',
    data,
  })
}

// 发送系统通知（支持指定用户或全部用户）
export const sendNotification = data => {
  return request({
    url: '/boss/api/notifications/send',
    method: 'post',
    data,
  })
}

// 更新系统通知
export const updateNotification = (notificationId, data) => {
  return request({
    url: `/boss/api/notifications/update/${notificationId}`,
    method: 'post',
    data,
  })
}

// 批量删除系统通知
export const batchDelete = data => {
  return request({
    url: '/boss/api/notifications/batch-delete',
    method: 'post',
    data,
  })
}
