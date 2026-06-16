import request from '../utils/request'

/**
 * 分页查询计算任务列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {string} [params.userId] - 用户ID
 * @param {string} [params.endpointType] - 端点类型
 * @param {string} [params.taskStatus] - 任务状态
 */
export const getTaskPage = params => {
  return request({
    url: '/boss/api/compute/tasks/page',
    method: 'get',
    params,
  })
}

/**
 * 获取任务详情
 * @param {string} taskId - 任务ID
 */
export const getTaskDetail = taskId => {
  return request({
    url: `/boss/api/compute/tasks/${taskId}`,
    method: 'get',
  })
}

/**
 * 重试失败任务
 * @param {string} taskId - 任务ID
 */
export const retryTask = taskId => {
  return request({
    url: `/boss/api/compute/tasks/${taskId}/retry`,
    method: 'post',
  })
}

/**
 * 获取任务统计
 */
export const getTaskStatistics = () => {
  return request({
    url: '/boss/api/compute/tasks/statistics',
    method: 'get',
  })
}

/**
 * 删除计算任务
 * @param {string} taskId - 任务ID
 */
export const deleteTask = taskId => {
  return request({
    url: `/boss/api/compute/tasks/${taskId}/delete`,
    method: 'post',
  })
}
