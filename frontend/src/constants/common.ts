export const CRYPTO_KEY = '';
export const VERIFY_CODE_TYPE = {
  LOGIN: 'LOGIN',
  REGISTER: 'REGISTER',
  RESET_PASSWORD: 'RESET_PASSWORD',
  UPDATE_EMAIL: 'UPDATE_EMAIL',
} as const

export const DEMO_CHART_PREFIX = 'NAUTILAB_DEMO'

export const FILE_TYPE = {
  AGREEMENT: 'AGREEMENT',
  AVATAR: 'AVATAR',
  CHART: 'CHART',
  COMPUTE_INPUT: 'COMPUTE_INPUT',
} as const
export type TFileType = typeof FILE_TYPE[keyof typeof FILE_TYPE]

export const MESSAGE_OPERATION = {
  DELETE: 'DELETE',
  MARK_READ: 'MARK_READ',
  MARK_UNREAD: 'MARK_UNREAD',
} as const
export type TMessageOperation = typeof MESSAGE_OPERATION[keyof typeof MESSAGE_OPERATION]
export const MESSAGE_STATUS = {
  UNREAD: 'UNREAD',
  READ: 'READ',
  DELETED: 'DELETED',
} as const
export type TMessageStatus = typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS]
export const MESSAGE_PRIORITY = {
  URGENT: 'URGENT',
  IMPORTANT: 'IMPORTANT',
  NORMAL: 'NORMAL',
} as const
export type TMessagePriority = typeof MESSAGE_PRIORITY[keyof typeof MESSAGE_PRIORITY]
export const MESSAGE_TYPE = {
  INVOICE: 'INVOICE',
  COMPUTE: 'COMPUTE',
  SYSTEM: 'SYSTEM',
  OTHER: 'OTHER',
} as const
export type TMessageType = typeof MESSAGE_TYPE[keyof typeof MESSAGE_TYPE]

export const PAYMENT_METHOD = {
  INTERNAL_POINT: 'INTERNAL_POINT',
  ALIPAY: 'ALIPAY',
  WECHAT: 'WECHAT',
  EXTERNAL: 'EXTERNAL',
} as const
export type TPaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD]