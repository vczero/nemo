import { Alert } from 'antd'
import type { AlertProps } from 'antd'

type ReportAlertProps = Omit<AlertProps, 'title' | 'type'>
export default function ReportAlert({ ...props }: ReportAlertProps) {
  return (
    <Alert
      {...props}
      type="info"
      title={`温馨提示：对图表进行编辑或修改时，仅会更新当前图表对应的数据，不会同步更新原始数据及任务结果数据。`}
    />
  )
}
