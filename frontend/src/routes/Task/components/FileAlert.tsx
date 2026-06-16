import { Alert } from 'antd'
import type { AlertProps } from 'antd'

type FileAlertProps = Omit<AlertProps, 'title' | 'type'> & { keyword: string }
export default function FileAlert({ keyword, ...props }: FileAlertProps) {
  return (
    <Alert
      {...props}
      type="info"
      title={`温馨提示：上传的 Excel 文件需包含字段 id, text。其中 id 为唯一标识，text 为${keyword}；id 列必须唯一，text 列不能为空。 text 列每个单元格的文本长度不能超过 5MB。每个文件最多 50,000 行，超过 50,000 行请分多个任务提交。`}
    />
  )
}
