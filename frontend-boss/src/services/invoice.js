import request from '../utils/request'

// 获取发票列表
export const getInvoiceList = params => {
  return request({
    url: '/boss/api/invoices',
    method: 'get',
    params,
  })
}

// 获取发票详情
export const getInvoiceDetail = invoiceId => {
  return request({
    url: `/boss/api/invoices/${invoiceId}`,
    method: 'get',
  })
}

// 开具发票
export const issueInvoice = (invoiceId, invoiceFileUrl) => {
  return request({
    url: `/boss/api/invoices/${invoiceId}/issue`,
    method: 'post',
    params: { invoiceFileUrl },
  })
}

// 更新发票状态
export const updateInvoiceStatus = (invoiceId, data) => {
  return request({
    url: `/boss/api/invoices/${invoiceId}/status`,
    method: 'post',
    params: data,
  })
}