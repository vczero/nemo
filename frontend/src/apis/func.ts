import { fetcher, fileFetcher, type TFetcherOptions } from '@/utils/fetcher'
import { sleep } from '@/utils/utils'
import {
  CHANGE_PASSWORD_ENDPOINT,
  CREATE_CHART_ENDPOINT,
  DELETE_CHART_ENDPOINT,
  GET_MESSAGES_ENDPOINT,
  LOGOUT_ENDPOINT,
  BATCH_MARK_AS_READED_ENDPOINT,
  REPLACE_CHART_FILE_ENDPOINT,
  RESET_PASSWORD_ENDPOINT,
  SEND_CODE_ENDPOINT,
  SIGNIN_ENDPOINT,
  SIGNUP_ENDPOINT,
  UPDATE_CHART_ENDPOINT,
  UPDATE_USER_AVATAR_ENDPOINT,
  UPDATE_USER_EMAIL_ENDPOINT,
  UPDATE_USER_ENDPOINT,
  UPLOAD_FILE_ENDPOINT,
  MARK_ALL_READED_ENDPOINT,
  CONVERET_SVG_TO_PDF_ENDPOINT,
  GET_ORDERS_ENDPOINT,
  CREATE_ORDER_ENDPOINT,
  GET_ORDER_STATUS_ENDPOINT,
  GET_ACCOUNT_SUBSCRIPTION_ENDPOINT,
  GET_SUBSCRIPTION_PLANS_ENDPOINT,
  GET_TOKEN_PACK_PRODUCTS_ENDPOINT,
  GET_TOKEN_PACK_ORDERS_ENDPOINT,
  GET_POINTS_RECORDS_ENDPOINT,
  GET_AVAILABLE_INVOICE_AMOUNT_ENDPOINT,
  APPLY_INVOICE_ENDPOINT,
  GET_INVOICE_LIST_ENDPOINT,
  CALCULATE_SUBSCRIPTION_AMOUNT_ENDPOINT,
  GET_SYS_CONFIG_ENDPOINT,
  GET_ALL_MY_CHARTS_ENDPOINT,
  GET_CHART_ENDPOINT,
} from './endpoints'
import type {
  TChangePasswordRequest,
  TChangePasswordResponse,
  TSendVerifyCodeRequest,
  TSendVerifyCodeResponse,
  TSignInResponse,
  TSignInRequest,
  TSignUpRequest,
  TSignUpResponse,
  TUpdateUserAvatarRequest,
  TUpdateUserAvatarResponse,
  TUpdateUserRequest,
  TUpdateUserResponse,
  TDeleteChartResponse,
  TUploadChartDataFileRequest,
  TUploadFileResponse,
  TCreateChartRequest,
  TCreateChartResponse,
  TReplaceChartFileRequest,
  TReplaceChartFileResponse,
  TUpdateUserEmailRequest,
  TUpdateUserEmailResponse,
  TResetPasswordResponse,
  TResetPasswordRequest,
  TGetMessagesRequest,
  TGetMessagesResponse,
  TMarkAsReadedRequest,
  TBatchMarkAsReadedRequest,
  TBatchMarkAsReadedResponse,
  TMarkAllReadedResponse,
  TConvertSvgToPdfRequest,
  TConvertSvgToPdfResponse,
  TSyncChartWithImageRequest,
  TSyncChartWithImageResponse,
  TOrderListRequest,
  TOrderListResponse,
  TCreateOrderRequest,
  TCreateOrderResponse,
  TOrderStatusResponse,
  TGetSubscriptionPlansResponse,
  TTokenPackProduct,
  TTokenPackOrderListRequest,
  TTokenPackOrderListResponse,
  TGetPointsRecordsRequest,
  TGetPointsRecordsResponse,
  TAccountSubscriptionResponse,
  TInvoiceAmountResponse,
  TApplyInvoiceRequest,
  TApplyInvoiceResponse,
  TInvoiceListRequest,
  TInvoiceListResponse,
  TCalculateSubscriptionAmountRequest,
  TCalculateSubscriptionAmountResponse,
  TUploadFileRequest,
  TSysConfig,
  TGetAllMyChartsResponse,
  TGetAllMyChartsRequest,
  TGetChartConfigResponse,
  TGetChartDetailRequest,
} from './types'
import { FILE_TYPE, MESSAGE_OPERATION } from '@/constants/common'

export const signUp = async (request: TSignUpRequest) => {
  const response = await fetcher<TSignUpResponse>(SIGNUP_ENDPOINT, {
    method: 'POST',
    body: request,
  })
  return response
}

export const signIn = async (request: TSignInRequest) => {
  const response = await fetcher<TSignInResponse>(SIGNIN_ENDPOINT, {
    method: 'POST',
    body: request,
  })
  return response
}

export const updateUser = async (request: TUpdateUserRequest) => {
  const response = await fetcher<TUpdateUserResponse>(UPDATE_USER_ENDPOINT, {
    method: 'POST',
    body: request,
  })
  return response
}

export const updateUserAvatar = async (request: TUpdateUserAvatarRequest) => {
  const formData = new FormData()
  formData.append('file', request.file)
  const response = await fetcher<TUpdateUserAvatarResponse>(
    UPDATE_USER_AVATAR_ENDPOINT,
    {
      method: 'POST',
      body: formData,
    }
  )
  return response
}

export const updatePassword = async (request: TChangePasswordRequest) => {
  const response = await fetcher<TChangePasswordResponse>(
    CHANGE_PASSWORD_ENDPOINT,
    {
      method: 'POST',
      body: request,
    }
  )
  return response
}

export const updateUserEmail = async (request: TUpdateUserEmailRequest) => {
  const response = await fetcher<TUpdateUserEmailResponse>(
    UPDATE_USER_EMAIL_ENDPOINT,
    {
      method: 'POST',
      body: request,
    }
  )
  return response
}

export const logout = async () => {
  const response = await fetcher(LOGOUT_ENDPOINT, {
    method: 'POST',
  })
  return response
}

export const resetPassword = async (request: TResetPasswordRequest) => {
  const response = await fetcher<TResetPasswordResponse>(
    RESET_PASSWORD_ENDPOINT,
    {
      method: 'POST',
      body: request,
    }
  )
  return response
}

export const sendVerifyCode = async (request: TSendVerifyCodeRequest) => {
  const response = await fetcher<TSendVerifyCodeResponse>(SEND_CODE_ENDPOINT, {
    method: 'POST',
    body: request,
  })
  return response
}

export const getMessages = async (request: TGetMessagesRequest) => {
  const response = await fetcher<TGetMessagesResponse>(GET_MESSAGES_ENDPOINT, {
    method: 'POST',
    body: request,
  })
  return response
}

export const markAllReaded = async () => {
  const response = await fetcher<TMarkAllReadedResponse>(
    MARK_ALL_READED_ENDPOINT,
    {
      method: 'POST',
    }
  )
  return response
}

export const batchMarkAsReaded = async (
  request: TBatchMarkAsReadedRequest,
  opts: TFetcherOptions = {}
) => {
  const response = await fetcher<TBatchMarkAsReadedResponse>(
    BATCH_MARK_AS_READED_ENDPOINT,
    {
      ...opts,
      method: 'POST',
      body: request,
    }
  )
  return response
}

export const markAsReaded = async ({ id }: TMarkAsReadedRequest) => {
  const request = {
    notificationIds: [id],
    operation: MESSAGE_OPERATION.MARK_READ,
  }
  const response = await batchMarkAsReaded(request, { fetcherOptions: { silent: true } })
  return response
}

export const getMyCharts = async (
  params: TGetAllMyChartsRequest
): Promise<TGetAllMyChartsResponse> => {
  return fetcher<TGetAllMyChartsResponse>(GET_ALL_MY_CHARTS_ENDPOINT, {
    method: 'POST',
    body: params,
  })
}

export const getChartDetail = async (request: TGetChartDetailRequest | string) => {
  const { chartId, ...params} = typeof request === 'string' ? { chartId: request } : request
  if (!chartId) throw new Error('图表ID不能为空')
  return fetcher<TGetChartConfigResponse>(GET_CHART_ENDPOINT(chartId), {
    method: 'GET',
    params: {
      withChartFile: params.withChartFile ?? true,
      withChartConfig: params.withChartConfig ?? true,
    },
  })
}

export const deleteChart = async (id: string) => {
  const response = await fetcher<TDeleteChartResponse>(
    DELETE_CHART_ENDPOINT(id),
    {
      method: 'POST',
    }
  )
  return response
}

export const uploadFile = async (
  request: TUploadFileRequest
) => {
  const formData = new FormData()
  formData.append('file', request.file)
  formData.append('fileType', request.fileType)
  const response = await fetcher<TUploadFileResponse>(
    UPLOAD_FILE_ENDPOINT,
    {
      method: 'POST',
      body: formData,
    }
  )
  return response
}

export const uploadChartDataFile = async (
  request: TUploadChartDataFileRequest
) => {
  const uploadRequest = {
    file: request.file,
    fileType: FILE_TYPE.CHART,
  }
  return await uploadFile(uploadRequest)
}

export const createChart = async (request: TCreateChartRequest) => {
  return await fetcher<TCreateChartResponse>(CREATE_CHART_ENDPOINT, {
    method: 'POST',
    body: request,
    fetcherOptions: { retry: 2 },
  })
}

export const syncChartWithImage = async (
  request: TSyncChartWithImageRequest
) => {
  const { chartId, chartImage, ...params } = request
  const formData = new FormData()
  if (chartImage) {
    formData.append('thumbnail', chartImage as unknown as File)
  }
  if (params && Object.keys(params).length > 0) {
    formData.append('param', JSON.stringify(params))
  }
  const response = await fetcher<TSyncChartWithImageResponse>(
    UPDATE_CHART_ENDPOINT(chartId),
    {
      method: 'POST',
      body: formData,
    }
  )
  return response
}

export const syncChartConfig = async (
  request: Omit<TSyncChartWithImageRequest, 'chartImage'>
) => {
  const { chartId, ...params } = request
  const formData = new FormData()
  formData.append('param', JSON.stringify(params))
  const response = await fetcher<TSyncChartWithImageResponse>(
    UPDATE_CHART_ENDPOINT(chartId),
    {
      method: 'POST',
      body: formData,
    }
  )
  return response
}

export const replaceChartDataFile = async (
  request: TReplaceChartFileRequest
) => {
  const formData = new FormData()
  formData.append('file', request.file)
  formData.append('fileType', FILE_TYPE.CHART)
  const response = await fetcher<TReplaceChartFileResponse>(
    REPLACE_CHART_FILE_ENDPOINT(request.fileId),
    {
      method: 'POST',
      body: formData,
    }
  )
  return response
}

export const convertSvgToPdf = async (request: TConvertSvgToPdfRequest) => {
  const formData = new FormData()
  formData.append('file', request)
  const response = await fileFetcher<TConvertSvgToPdfResponse>(
    CONVERET_SVG_TO_PDF_ENDPOINT,
    undefined,
    {
      method: 'POST',
      body: formData,
    }
  )
  return response
}

export const getOrders = async (request: TOrderListRequest) => {
  const response = await fetcher<TOrderListResponse>(GET_ORDERS_ENDPOINT, {
    method: 'POST',
    body: request,
  })
  return response
}

export const getAccountInfo = async () => {
  const response = await fetcher<TAccountSubscriptionResponse>(
    GET_ACCOUNT_SUBSCRIPTION_ENDPOINT,
    {
      method: 'GET',
    }
  )
  return response
}

export const getSubscriptionPlans = async () => {
  const response = await fetcher<TGetSubscriptionPlansResponse>(
    GET_SUBSCRIPTION_PLANS_ENDPOINT,
    {
      method: 'GET',
    }
  )
  return response
}

export const calculateSubscriptionAmount = async (
  request: TCalculateSubscriptionAmountRequest
) => {
  const response = await fetcher<TCalculateSubscriptionAmountResponse>(
    CALCULATE_SUBSCRIPTION_AMOUNT_ENDPOINT(request.planId),
    {
      method: 'GET',
      params: { subscribeMonth: request.subscribeMonth},
      fetcherOptions: { retry: 2 }
    }
  )
  return response
}

export const getTokenPackProducts = async () => {
  const response = await fetcher<TTokenPackProduct[]>(
    GET_TOKEN_PACK_PRODUCTS_ENDPOINT,
    {
      method: 'GET',
    }
  )
  return response
}

export const getTokenPackOrders = async (request: TTokenPackOrderListRequest) => {
  const params = new URLSearchParams(
    request as unknown as Record<string, string>
  )
  const response = await fetcher<TTokenPackOrderListResponse>(
    `${GET_TOKEN_PACK_ORDERS_ENDPOINT}?${params.toString()}`,
    {
      method: 'GET',
    }
  )
  return response
}

export const getPointsRecords = async (request: TGetPointsRecordsRequest) => {
  const params = new URLSearchParams(
    request as unknown as Record<string, string>
  )
  const response = await fetcher<TGetPointsRecordsResponse>(
    `${GET_POINTS_RECORDS_ENDPOINT}?${params.toString()}`,
    {
      method: 'GET',
    }
  )
  return response
}

export const createOrder = async (request: TCreateOrderRequest) => {
  const response = await fetcher<TCreateOrderResponse>(CREATE_ORDER_ENDPOINT, {
    method: 'POST',
    body: request,
  })
  return response
}

// let count = 0
export const getOrderStatus = async (orderId: string) => {
  // count++
  // if (count > 2) {
  //   await sleep(1000)
  //   return 'PAID'
  // }
  const response = await fetcher<TOrderStatusResponse>(GET_ORDER_STATUS_ENDPOINT(orderId), {
    method: 'GET',
  })
  return response
}

export const getAvailableInvoiceAmount = async () => {
  const response = await fetcher<TInvoiceAmountResponse>(
    GET_AVAILABLE_INVOICE_AMOUNT_ENDPOINT,
    {
      method: 'GET',
    }
  )
  return response
}

export const applyInvoice = async (request: TApplyInvoiceRequest) => {
  const response = await fetcher<TApplyInvoiceResponse>(APPLY_INVOICE_ENDPOINT, {
    method: 'POST',
    body: request,
  })
  return response
}

export const getSysConfig = async () => {
  const response = await fetcher<TSysConfig>(GET_SYS_CONFIG_ENDPOINT, {
    method: 'GET',
    fetcherOptions: { silent: true, requiredAuth: false },
  })
  return response
}

export const getInvoiceList = async (request: TInvoiceListRequest) => {
  const response = await fetcher<TInvoiceListResponse>(
    `${GET_INVOICE_LIST_ENDPOINT}`,
    {
      method: 'GET',
      params: request,
    }
  )
  return response
}
