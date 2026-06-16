import { Input, Tag } from 'antd'
import { BarChartOutlined } from '@ant-design/icons'
import {
  ChartCategory,
  ChartCategoryLabel,
  ChartPurpose,
  ChartPurposeLabel,
} from '@/chart'

const tagsData = Object.entries(ChartCategory).reduce(
  (acc, [_, value]) => {
    return [
      ...acc,
      {
        label: ChartCategoryLabel[value],
        value: value,
      },
    ]
  },
  [
    {
      label: '全部',
      value: 'all',
    },
  ] as { label: string; value: string }[]
)

const purposeTagsData = Object.entries(ChartPurpose).reduce(
  (acc, [_, value]) => {
    return [
      ...acc,
      {
        label: ChartPurposeLabel[value],
        value: value,
      },
    ]
  },
  [
    {
      label: '全部',
      value: 'all',
    },
  ] as { label: string; value: string }[]
)

export default function Sidebar({
  selectedCategory,
  onSelectedCategoryChange,
  selectedPurpose,
  onSelectedPurposeChange,
  keywords,
  onKeywordsChange,
}: {
  selectedCategory: string
  onSelectedCategoryChange: (category: string) => void
  selectedPurpose: string
  onSelectedPurposeChange: (purpose: string) => void
  keywords: string
  onKeywordsChange: (keywords: string) => void
}) {
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onKeywordsChange(e.target.value)
  }

  return (
    <div className="w-100% h-full p-4">
      <div>
        <Input
          placeholder="搜索图表"
          value={keywords}
          onChange={handleKeywordsChange}
        />
      </div>
      <div className="mt-4">
        <h2 className="text-ml font-bold">
          <BarChartOutlined className="mr-1 mb-1" />
          按图表类型
        </h2>
        {tagsData.map((tag) => (
          <Tag.CheckableTag
            key={tag.value}
            checked={selectedCategory === tag.value}
            onChange={(checked) => {
              onSelectedPurposeChange('all')
              onSelectedCategoryChange(checked ? tag.value : 'all')
            }}
            className={
              selectedCategory === tag.value
                ? 'mt-1 mr-1'
                : 'mt-1 mr-1 bg-white'
            }
          >
            {tag.label}
          </Tag.CheckableTag>
        ))}
      </div>
      <div className="mt-4">
        <h2 className="text-ml font-bold">
          <BarChartOutlined className="mr-1 mb-1" />
          按使用目的
        </h2>
        {purposeTagsData.map((tag) => (
          <Tag.CheckableTag
            key={tag.value}
            checked={selectedPurpose === tag.value}
            onChange={(checked) => {
              onSelectedCategoryChange('all')
              onSelectedPurposeChange(checked ? tag.value : 'all')
            }}
            className={
              selectedPurpose === tag.value ? 'mt-1 mr-1' : 'mt-1 mr-1 bg-white'
            }
          >
            {tag.label}
          </Tag.CheckableTag>
        ))}
      </div>
    </div>
  )
}
