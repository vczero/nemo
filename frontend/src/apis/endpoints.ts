export const GET_USER_ENDPOINT = '/api/user/current'
export const SEND_CODE_ENDPOINT = '/api/email/send-register-code'
export const SIGNUP_ENDPOINT = '/api/user/register-by-email'
export const SIGNIN_ENDPOINT = '/api/user/login'
export const AGREEMENT_ENDPOINT = '/api/agreement/latest'
export const LOGOUT_ENDPOINT = '/api/user/logout'
export const UPDATE_USER_ENDPOINT = '/api/user/update'
export const CHANGE_PASSWORD_ENDPOINT = '/api/user/change-password-by-password'
export const UPDATE_USER_AVATAR_ENDPOINT = '/api/user/update-avatar'
export const GET_INVITATION_INFO_ENDPOINT = '/api/account/invitation'
export const GET_POINTS_BALANCE_ENDPOINT = '/api/account/points/stats'
export const UPDATE_USER_EMAIL_ENDPOINT = '/api/user/update-email'
export const RESET_PASSWORD_ENDPOINT = '/api/user/change-password-by-code'

// System config
export const GET_SYS_CONFIG_ENDPOINT = '/api/sysctl/config'

// message related
export const GET_UNREAD_MESSAGE_COUNT_ENDPOINT =
  '/api/notifications/unread-count'
export const GET_MESSAGES_ENDPOINT = '/api/notifications/page'
export const MARK_ALL_READED_ENDPOINT = '/api/notifications/mark-all-read'
export const BATCH_MARK_AS_READED_ENDPOINT =
  '/api/notifications/batch-operation'

// Charts related
export const UPLOAD_FILE_ENDPOINT = '/api/files/add'
export const REPLACE_CHART_FILE_ENDPOINT = (id: string) =>
  `/api/files/${id}/update`
export const CREATE_CHART_ENDPOINT = '/api/charts/add'
export const GET_CHART_ENDPOINT = (id: string) => `/api/charts/${id}/get`
export const DELETE_CHART_ENDPOINT = (id: string) => `/api/charts/${id}/delete`
export const UPDATE_CHART_ENDPOINT = (id: string) => `/api/charts/${id}/update`
export const GET_ALL_MY_CHARTS_ENDPOINT = '/api/charts/page'
export const CONVERET_SVG_TO_PDF_ENDPOINT = '/api/files/svg-to-pdf'

// Orders related
export const GET_ORDERS_ENDPOINT = '/api/subscription/orders'
export const CREATE_ORDER_ENDPOINT = '/api/orders/add'
export const GET_ORDER_STATUS_ENDPOINT = (orderId: string) => `/api/orders/${orderId}/status`

// Subscription related
export const GET_ACCOUNT_SUBSCRIPTION_ENDPOINT = '/api/account/plan'
export const GET_SUBSCRIPTION_PLANS_ENDPOINT = '/api/subscription/plans'
export const CALCULATE_SUBSCRIPTION_AMOUNT_ENDPOINT = (planId: string) =>
  `/api/subscription/${planId}/calculate`

// Points related
export const GET_POINTS_RECORDS_ENDPOINT = '/api/account/points/page'

// Topup related
export const GET_TOKEN_PACK_PRODUCTS_ENDPOINT = '/api/token-pack/products'
export const GET_TOKEN_PACK_ORDERS_ENDPOINT = '/api/token-pack/orders'

// Invoice related
export const GET_AVAILABLE_INVOICE_AMOUNT_ENDPOINT = '/api/invoices/available-amount'
export const APPLY_INVOICE_ENDPOINT = '/api/invoices/apply'
export const GET_INVOICE_LIST_ENDPOINT = '/api/invoices/page'

// ML App related
export const GET_ML_TASK_CONFIG_ENDPOINT = `/api/compute/config`
export const SUBMIT_ML_TASK_TASK_ENDPOINT = `/api/compute/submit`
export const GET_ML_TASK_RESULT_ENDPOINT = (taskId: string) =>
  `/api/compute/tasks/${taskId}/result`
export const GET_ML_TASK_LIST_ENDPOINT = `/api/compute/tasks`
export const DELETE_ML_TASK_ENDPOINT = (taskId: string) =>
  `/api/compute/${taskId}/delete`
export const UPDATE_ML_TASK_NAME_ENDPOINT = (taskId: string) =>
  `/api/compute/${taskId}/name`

// Chart Interpret related
export const CHART_INTERPRET_ENDPOINT = (chartId: string) =>
  `/api/charts/${chartId}/interpret`
export const CHART_INTERPRET_TRANSLATE_ENDPOINT = (chartId: string) =>
  `/api/charts/${chartId}/interpret/translate`