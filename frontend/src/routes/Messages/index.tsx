import MessageList from '@/components/MessageList'
import { MESSAGE_TYPE } from '@/constants/common'
import { BellOutlined } from '@ant-design/icons'

export default function Messages() {
  return (
    <MessageList types={[MESSAGE_TYPE.SYSTEM, MESSAGE_TYPE.INVOICE, MESSAGE_TYPE.COMPUTE, MESSAGE_TYPE.OTHER]} icon={<BellOutlined  />} title="消息中心" />
  )
}
