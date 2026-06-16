import type { ChartConfig } from '@/chart'
import type { VERIFY_CODE_TYPE , TMessageOperation, TMessagePriority, TMessageStatus, TMessageType, TFileType, TPaymentMethod } from '@/constants/common'
import type { TTaskType } from '@/constants/ml_task'

export type TAgreementAPI = {
  agreementId: string
  url: string
  title: string
  type: number
}[]

export interface TSignUpRequest {
  email: string
  password: string
  verifyCode: string
  nickname?: string
  inviteCode?: string
}

export type TSignUpResponse = void

export interface TSignInRequest {
  username: string
  password: string
  agreementIds: string[]
}

export type TSignInResponse = void

export interface TSendVerifyCodeRequest {
  email: string
  type: keyof typeof VERIFY_CODE_TYPE
}

export type TSendVerifyCodeResponse = string

export interface TUpdateUserRequest {
  email?: string
  nickname?: string
  organization?: string
}

export type TUpdateUserResponse = void

export interface TChangePasswordRequest {
  oldPassword: string
  newPassword: string
}

export type TChangePasswordResponse = void

export interface TUpdateUserAvatarRequest {
  file: File
}

export type TUpdateUserAvatarResponse = void

export interface TGetAllMyChartsRequest {
  businessId?: string
  chartName?: string
  keyword?: string
  pageNum: number
  pageSize: number
}

export type TGetAllMyChartsResponse = {
  list: {
    chartId: string
    chartName: string
    thumbnailUrl: string
    createTime: string
    updateTime: string
    task?: {
      taskId: string
      taskType: TTaskType
    }
  }[]
  pageNum: number
  pageSize: number
  total: number
}

export type TDeleteChartRequest = void
export type TDeleteChartResponse = void

export interface TGetChartDetailRequest {
  chartId: string
  withChartFile?: boolean
  withChartConfig?: boolean
}

export type TGetChartConfigResponse = {
  chartId: string
  chartName?: string
  chartConfig?: ChartConfig
  thumbnailUrl?: string
  purpose?: string
  interpretContent?: string
  interpretContentEn?: string
  chartFile?: {
    content?: Record<string, unknown>[]
    fileId?: string
    fileName?: string
    fileSize?: number
    url?: string
  }
}

export interface TUploadFileRequest {
  file: File
  fileType: TFileType
}

export type TUploadChartDataFileRequest = Omit<TUploadFileRequest, 'fileType'>

export interface TUploadFileResponse {
  fileId: string
  fileName: string
  fileSize: number
  url: string
  ossPath: string
}

export interface TCreateChartRequest {
  chartName?: string
  chartConfig?: ChartConfig
  fileId: string,
  taskId?: string
}

export type TCreateChartResponse = string

export interface TSyncChartWithImageRequest {
  chartId: string
  chartName?: string
  chartConfig?: ChartConfig
  fileId?: string
  chartImage?: File | null
}

export type TSyncChartWithImageResponse = void

export interface TReplaceChartFileRequest {
  fileId: string
  file: File
}

export type TReplaceChartFileResponse = TUploadFileResponse

export type TGetUnreadMessageCountResponse = {
  total: number
}

export interface TUpdateUserEmailRequest {
  newEmail: string
  verifyCode: string
}

export type TUpdateUserEmailResponse = void

export interface TResetPasswordRequest {
  email: string
  newPassword: string
  verifyCode: string
}

export type TResetPasswordResponse = void

export interface TGetMessagesRequest {
  pageSize: number
  pageNum: number
  businessId?: string
  keyword?: string
  priority?: TMessagePriority
  status?: TMessageStatus[] // TODO: 默认应该传数据, 待改
  types?: TMessageType[]
}

export interface TMessageItem {
  notificationId: string;
  title: string;
  content: string;
  type: TMessageType;
  priority: TMessagePriority;
  status: TMessageStatus;
  createTime: number; // 时间戳
  readTime?: number;
  linkId?: string;
  linkUrl?: string;
}


export type TGetMessagesResponse = {
  list: TMessageItem[]
  total: number
  pageNum: number
  pageSize: number
}

export type TMarkAllReadedRequest = void
export type TMarkAllReadedResponse = void

export interface TBatchMarkAsReadedRequest {
  notificationIds: string[]
  operation: TMessageOperation
}

export type TBatchMarkAsReadedResponse = void

export interface TMarkAsReadedRequest {
  id: string
}

export type TMarkAsReadedResponse = void

export type TConvertSvgToPdfRequest = File

export type TConvertSvgToPdfResponse = ArrayBuffer | null
export interface OrderUserDTO {
  /**
   * 头像URL
   */
  avatarUrl: string;
  /**
   * 邮箱
   */
  email: string;
  /**
   * 昵称
   */
  nickname: string;
  /**
   * 手机号
   */
  phone: string;
  /**
   * 用户ID
   */
  userId: string;
  /**
   * 用户名
   */
  username: string;
}

export interface TOrderDTO {
  /**
   * 账户ID
   */
  accountId: string;
  /**
   * 创建时间
   */
  createTime: number;
  /**
   * 优惠金额
   */
  discountAmount: number;
  /**
   * 订单过期时间
   */
  expireTime: number;
  /**
   * 订单ID
   */
  orderId: string;
  /**
   * 订单编号
   */
  orderNo: string;
  /**
   * 订单产品快照
   */
  orderSnapshot: string;
  /**
   * 原价总额
   */
  originalAmount: number;
  /**
   * 支付时间
   */
  paidTime: number;
  /**
   * 实付金额
   */
  payAmount: number;
  /**
   * 支付方式,可用值:ALIPAY,WECHAT
   */
  payMethod: TPaymentMethod;
  /**
   * 支付方式描述
   */
  payMethodDescription: string;
  /**
   * 套餐详情链接
   */
  planLink: string;
  /**
   * 套餐名称
   */
  planName: string;
  /**
   * 积分抵扣金额
   */
  pointsDeductAmount: number;
  /**
   * 使用积分数量
   */
  pointsUsed: number;
  /**
   * 产品ID
   */
  productId: string;
  /**
   * 产品详情链接
   */
  productLink: string;
  /**
   * 产品名称
   */
  productName: string;
  /**
   * 购买数量
   */
  quantity: number;
  /**
   * 备注
   */
  remark: string;
  /**
   * 订单状态,可用值:CANCELLED,PAID,REFUNDED,UN_PAY
   */
  status: 'CANCELLED' | 'PAID' | 'REFUNDED' | 'UN_PAY';
  /**
   * 订单状态描述
   */
  statusDescription: string;
  /**
   * 套餐ID
   */
  subscriptionPlanId: string;

  subscriptionStartTime: number
  subscriptionEndTime: number
  /**
   * 用户信息
   */
  user: OrderUserDTO;
}


export interface TOrderListResponse {
  list: TOrderDTO[]
  pageNum: number
  pageSize: number
  total: number
}

export interface TOrderListRequest {
  businessId?: string
  keyword?: string
  pageNum: number
  pageSize: number
}

export interface TAccountSubscription {
  features: string[]
  planDescription: string
  planId: string
  planName: string
  planType: 'FREE' | 'PRIVATE' | 'STANDARD'
  subscriptionEndTime: number
  subscriptionStatus: 'ACTIVE' | 'EXPIRED'
}

export type TAccountSubscriptionResponse = TAccountSubscription

export interface TPricingRule {
  name: string
  months: number
  discount: number
}

export interface TSubscriptionPlan {
  planId: string
  planName: string
  planType: 'FREE' | 'PRIVATE' | 'STANDARD'
  planDescription: string
  monthlyPrice: number
  features: string[]
  pricingRules: TPricingRule[]
  isActive: boolean
  isRecommended: boolean
  sortOrder: number
  totalEarnedPoint: number
}

export type TGetSubscriptionPlansResponse = TSubscriptionPlan[]

export interface TCalculateSubscriptionAmountRequest {
  planId: string
  subscribeMonth: number
}

export interface TCalculateSubscriptionAmountResponse {
  amount: number // 最终金额
  deductPoint: number // 可抵扣积分
  discount: number // 折扣，比如包年0.88折
  discountAmount: number // 折扣金额
  discountedAmount: number // 折后金额
  monthlyPrice: number // 月订阅价格
  originAmount: number // 原始金额
  pointDeductAmount: number // 积分可抵扣金额
  pointsBalance: number // 用户积分余额
  subscribeMonth: number // 月数
  annualDeductedPoint: number // 年度已抵扣积分
}

export interface TTopupSku {
  skuId: string
  price: number
  tokenAmount: number
  isActive: boolean
  sortOrder: number
}

export type TGetTopupSkusResponse = TTopupSku[]

export interface TTokenPackProduct {
  productId: string
  productName: string
  tokenAmount: number
  originalPrice: number
  currentPrice: number
  validityDays: number
}

export interface TTokenPackOrderDTO {
  createTime: number
  expireTime: number
  orderId: string
  orderNo: string
  paidTime: number
  payAmount: number
  productName: string
  status: string
  statusDesc: string
  tokenInitialAmount: number
  tokenRemainingAmount: number
  tokenUsedAmount: number
}

export interface TTokenPackOrderListResponse {
  list: TTokenPackOrderDTO[]
  pageNum: number
  pageSize: number
  total: number
}

export interface TTokenPackOrderListRequest {
  businessId?: string
  keyword?: string
  pageNum: number
  pageSize: number
}

export interface TPointsRecord {
  balanceAfter: number // 积分余额
  createTime: number // 创建时间
  points: number // 获得或减少积分数量
  recordId: string // 记录ID
  remark: string // 备注
  type: 'ACTIVITY' | 'ADMIN_ADJUST' | 'INVITED_REWARD' | 'INVITE_REWARD' | 'ORDER_DEDUCT' // 积分来源
  typeName: string // 积分来源
}

export interface TGetPointsRecordsRequest {
  pageNum: number
  pageSize: number
}

export interface TGetPointsRecordsResponse {
  list: TPointsRecord[]
  pageNum: number
  pageSize: number
  total: number
}

export interface TGetInvitationInfoResponse {
  invitationCode: string // 邀请码
  invitationUrl: string // 邀请链接
  inviteeRewardPoints: number // 被邀请人奖励积分数
  inviterRewardPoints: number // 邀请人奖励积分数
}

export interface TGetPointsBalanceResponse {
  invitedCount: number // 邀请人数
  pointBalance: number // 积分余额
  totalPoints: number // 获得总积分
  usedPoints: number // 已使用积分
}

export interface TCreateOrderRequest {
  payMethod: TPaymentMethod;
  payQrCodeWidth?: number;
  planId?: string;
  productId?: string;
  remark?: string;
  subscribeMonth?: number;
}

export interface TCreateOrderResponse {
  orderId: string;
  payFormHtml: string;
  payMethod: TPaymentMethod;
}

export type TOrderStatusResponse = 'CANCELLED' | 'PAID' | 'REFUNDED' | 'UN_PAY';

export interface TInvoiceAmountResponse {
  availableAmount: number
  totalInvoicedAmount: number
  totalPaidAmount: number
}

export interface TApplyInvoiceRequest {
  amount: number
  creditCode?: string
  email: string
  invoiceType: 'ENTERPRISE' | 'PERSONAL'
  remark?: string
  title: string
}

export type TApplyInvoiceResponse = 'CANCELLED' | 'PAID' | 'REFUNDED' | 'UN_PAY' | string

export interface TInvoiceDTO {
  amount: number
  applyTime: number
  createTime: number
  creditCode: string
  email: string
  invoiceFileUrl: string
  invoiceId: string
  invoiceNo: string
  invoiceType: 'ENTERPRISE' | 'PERSONAL'
  invoiceTypeDescription: string
  issueTime: number
  rejectReason: string
  remark: string
  status: 'ISSUED' | 'PENDING' | 'PROCESSING' | string
  statusDescription: string
  title: string
}

export interface TInvoiceListRequest {
  businessId?: string
  keyword?: string
  pageNum: number
  pageSize: number
}

export interface TInvoiceListResponse {
  list: TInvoiceDTO[]
  pageNum: number
  pageSize: number
  total: number
}

export interface TBannerConfig {
  imageUrl?: string
  link?: string
}

export interface TMenuConfig {
  link: string
  name: string
}

export interface TViewConfig {
  banner?: TBannerConfig
  menus?: TMenuConfig[]
}

export interface TSysConfig {
  viewConfig?: TViewConfig
}
