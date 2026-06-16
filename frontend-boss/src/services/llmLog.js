import request from '../utils/request'

/**
 * 分页查询LLM日志列表
 * @param {Object} params - 查询参数
 * @param {number} params.pageNum - 页码
 * @param {number} params.pageSize - 每页条数
 * @param {string} [params.userId] - 用户ID
 * @param {string} [params.bizType] - 业务类型
 * @param {number} [params.startDate] - 开始时间
 * @param {number} [params.endDate] - 结束时间
 */
export const getLlmLogPage = params => {
  // 过滤空值，不发送参数
  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key] = value
    }
    return acc
  }, {})
  return request({
    url: '/boss/api/llm-log/list',
    method: 'get',
    params: filteredParams,
  })
}

/**
 * 获取LLM日志详情
 * @param {string} logId - 日志ID
 */
export const getLlmLogDetail = logId => {
  return request({
    url: `/boss/api/llm-log/${logId}`,
    method: 'get',
  })
}
