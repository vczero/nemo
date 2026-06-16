export const MESSAGE_EVENT = 'NUALTILAB_MESSAGE_EVENT'

export const MESSAGE_EVENT_TYPE = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

export type TMessageEventType = (typeof MESSAGE_EVENT_TYPE)[keyof typeof MESSAGE_EVENT_TYPE]
export type TCustomMessageEvent = CustomEvent<{
  type: TMessageEventType,
  params: {
    message: string
    duration?: number
    onClose?: () => void
  }
}>

export const sendMessageEvent = (
  eventType: TMessageEventType,
  message: string,
  duration?: number,
  onClose?: () => void
) => {
  window.dispatchEvent(
    new CustomEvent(MESSAGE_EVENT, { detail: { type: eventType,  params: { message, duration, onClose } } })
  )
}

export const success = (
  message: string,
  duration?: number,
  onClose?: () => void
) => sendMessageEvent(MESSAGE_EVENT_TYPE.SUCCESS, message, duration, onClose)

export const error = (
  message: string,
  duration?: number,
  onClose?: () => void
) => sendMessageEvent(MESSAGE_EVENT_TYPE.ERROR, message, duration, onClose)

export const warning = (
  message: string,
  duration?: number,
  onClose?: () => void
) => sendMessageEvent(MESSAGE_EVENT_TYPE.WARNING, message, duration, onClose)

export const info = (
  message: string,
  duration?: number,
  onClose?: () => void
) => sendMessageEvent(MESSAGE_EVENT_TYPE.INFO, message, duration, onClose)

export const messageApi = {
  success,
  error,
  warning,
  info,
}
