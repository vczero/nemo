import { Drawer } from 'antd'
import type { TStoryChartItem } from '@/apis'
import StoryReport from './StoryReport'

interface PreviewBodyProps {
  title: string
  author?: string
  description?: string
  charts: TStoryChartItem[]
  onChangeDescription: (index: number, value: string) => void
}

interface PreviewDrawerProps extends PreviewBodyProps {
  open: boolean
  closable: boolean
  onClose: () => void
  getContainer?: () => HTMLElement
}

const now = Date.now()
export default function PreviewDrawer({
  open,
  onClose,
  closable = true,
  getContainer,
  title,
  author,
  description,
  charts,
  onChangeDescription,
}: PreviewDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      closable={closable}
      size={768}
      mask={false}
      title="预览效果"
      getContainer={getContainer}
      classNames={{ root: 'absolute' }}
    >
      <div className="mx-auto w-full bg-white shadow-sm">
        <StoryReport
          title={title}
          author={author}
          createTime={now}
          description={description}
          charts={charts}
          editable={true}
          onEdit={onChangeDescription}
        />
      </div>
    </Drawer>
  )
}
