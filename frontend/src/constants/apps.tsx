import type { ReactNode } from 'react';
import Icon, {
  PieChartOutlined,
  SmileOutlined, // 情感分析
  DeploymentUnitOutlined,
  ApartmentOutlined,
  SoundOutlined,
  ScissorOutlined, // 文本摘要
  FundProjectionScreenOutlined,
  FileTextOutlined,
  TagsOutlined, // TF-IDF
  CopyOutlined, // 文本相似度
  ApiOutlined,
  ReadOutlined, // 研究报告
  // AuditOutlined,   // 立场检测
  // BgColorsOutlined,
  // AimOutlined,
  // CodeSandboxOutlined,
  // FireOutlined,
  // CoffeeOutlined,
  // PartitionOutlined,
  // CopyOutlined,  // 文本相似度
  // GroupOutlined,
} from '@ant-design/icons';
import { TASK_METADATA_MAP } from '@/constants/ml_task';

export const ICON_COMPONENTS = {
  ApiOutlined,
  PieChartOutlined,
  SmileOutlined, // 情感分析
  DeploymentUnitOutlined,
  ApartmentOutlined,
  SoundOutlined,
  ScissorOutlined, // 文本摘要
  FundProjectionScreenOutlined,
  FileTextOutlined,
  TagsOutlined, // TF-IDF
  CopyOutlined, // 文本相似度
}

import type { TAppItem } from '@/components/AllApps';

const IconWrapper = ({ icon, color }: { icon: ReactNode | string, color?: string }) => {
  let iconComponent
  if (typeof icon === 'string') {
    const IconComponent = ICON_COMPONENTS[icon as keyof typeof ICON_COMPONENTS] || TagsOutlined
    iconComponent = <IconComponent />
  } else {
    iconComponent = icon
  }

  return <span style={{ fontSize: '24px', color: color || '#1677ff' }}>{iconComponent}</span>
};

const colorArray = [
  '#00b96b',
  '#fa8c16',
  '#eb2f96',
  '#722ed1',
  '#ff7875',
  '#13c2c2',
  '#FFC107',
  '#1677ff',
  '#890e0e',
  '#ff4d4f'
]


export const appList: TAppItem[] = [
  {
    id: '/apps/charts',
    title: '数据可视化',
    description: '上传数据后可自动配置图表，并结合轻量模型完成数据挖掘、分析与可视化展示。',
    icon: <IconWrapper icon={<FundProjectionScreenOutlined />} color="#722ed1" />,
    path: '/apps/charts',
  },
  {
    id: '/apps/storytelling',
    title: '研究报告',
    description: '将已有图表与解读组合为一份研究报告 (Storytelling) 报告，并支持分享与移动端浏览。',
    icon: <IconWrapper icon={<ReadOutlined />} color="#1677ff" />,
    path: '/apps/storytelling',
  },
  // {
  //   id: '/apps/data-agent',
  //   title: 'Data Agent',
  //   description: '使用大语言模型和智能体对数据进行深度解读，生成详细的数据报告',
  //   icon: <IconWrapper icon={<FireOutlined />} color="#ff4d4f" />,
  //   path: '/apps/data-agent',
  //   tags: [{ label: '内测中', color: '#ff4d4f' }]
  // },
  ...Object.values(TASK_METADATA_MAP).map((item, index) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    icon: <IconWrapper icon={item.icon} color={colorArray[index]} />,
    path: item.path,
  })),
];