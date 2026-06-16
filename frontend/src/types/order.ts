export interface Order {
  accountId: string
  createTime: number
  discountAmount: number
  expireTime: number
  orderId: string
  orderNo: string
  orderSnapshot: string
  originalAmount: number
  paidTime: number
  payAmount: number
  payMethod: 'ALIPAY' | 'WECHAT'
  payMethodDescription: string
  planLink: string
  planName: string
  pointsDeductAmount: number
  pointsUsed: number
  productLink: string
  productName: string
  quantity: number
  remark: string
  status: 'CANCELLED' | 'PAID' | 'REFUNDED' | 'UN_PAY'
  statusDescription: string
}

export interface OrderListResponse {
  list: Order[]
  pageNum: number
  pageSize: number
  total: number
}

export interface OrderListParams {
  businessId?: string
  keyword?: string
  pageNum?: number
  pageSize?: number
}
