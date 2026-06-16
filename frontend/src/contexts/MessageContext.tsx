import { createContext, useEffect, type ReactNode } from 'react'
import { App } from 'antd'
import { MESSAGE_EVENT, MESSAGE_EVENT_TYPE, type TCustomMessageEvent } from '@/utils/globalMessage'

export const MessageContext = createContext<undefined>(undefined)

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const { message: messageApi } = App.useApp()

  useEffect(() => {
    const messageEventCallback = (event: Event) => {
      if (!(event instanceof CustomEvent)) return

      const { type, params } = (event as TCustomMessageEvent).detail
      const { message, duration, onClose } = params

      if (type === MESSAGE_EVENT_TYPE.SUCCESS) {
        messageApi.success(message, duration, onClose)
      } else if (type === MESSAGE_EVENT_TYPE.WARNING) {
        messageApi.warning(message, duration, onClose)
      } else if (type === MESSAGE_EVENT_TYPE.ERROR) {
        messageApi.error(message, duration, onClose)
      } else if (type === MESSAGE_EVENT_TYPE.INFO) {
        messageApi.info(message, duration, onClose)
      }
    }

    window.addEventListener(MESSAGE_EVENT, messageEventCallback)

    return () => {
      window.removeEventListener(MESSAGE_EVENT, messageEventCallback)
    }
  }, [])

  return <MessageContext.Provider value={undefined}>{children}</MessageContext.Provider>
}
