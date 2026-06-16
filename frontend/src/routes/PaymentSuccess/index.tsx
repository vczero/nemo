import { Result } from 'antd'

const PaymentSuccess: React.FC = () => {
  return (
    <Result
      status="success"
      title="支付成功"
      subTitle="正在为您处理订单"
      styles={{
        root: { width: '200px', height: '200px', padding: '32px', overflow: 'hidden' },
        icon: { marginBottom: 0 },
        title: {
          marginBottom: 0,
        },
      }}
    />
  )
}

export default PaymentSuccess
