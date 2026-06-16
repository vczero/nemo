export const TASK_TYPES = {
  CO_OCCURRENCE: 'CO_OCCURRENCE',
  WORD_SEGMENTATION: 'SEGMENTATION',
  SENTIMENT: 'SENTIMENT',
  SENTIMENT_CLASSIFICATION: 'SENTIMENT_CLASSIFICATION',
  TEXT_SUMMARY: 'TEXT_SUMMARY',
  TOPIC_OCCURRENCE: 'TOPIC_OCCURRENCE',
  NEWS_CLASSIFICATION: 'NEWS_CLASSIFICATION',
  TEXT_CLASSIFICATION: 'TEXT_CLASSIFICATION',
  TF_IDF: 'TF_IDF',
  DOC_SIM: 'DOC_SIM',
} as const
export type TTaskType = (typeof TASK_TYPES)[keyof typeof TASK_TYPES]

/** Alias for accessing enum-style member types, e.g. TaskType['WORD_SEGMENTATION'] */
export type TaskType = typeof TASK_TYPES
// CANCELLED,FAILED,PENDING,RUNNING,SUCCESS
export const TASK_STATUS = {
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  SUCCESS: 'SUCCESS'
} as const
export type TTaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS]

export const TASK_TYPE_LABELS: Record<string, string> = {
  [TASK_TYPES.WORD_SEGMENTATION]: '分词与统计',
  [TASK_TYPES.CO_OCCURRENCE]: '语义共现网络',
  [TASK_TYPES.SENTIMENT]: '情感分析与计算',
  [TASK_TYPES.SENTIMENT_CLASSIFICATION]: '情感分类',
  [TASK_TYPES.TEXT_SUMMARY]: '文本摘要',
  [TASK_TYPES.TOPIC_OCCURRENCE]: '主题共现网络',
  [TASK_TYPES.NEWS_CLASSIFICATION]: '新闻主题分类',
  [TASK_TYPES.TEXT_CLASSIFICATION]: '文本分类',
  [TASK_TYPES.TF_IDF]: 'TF-IDF',
  [TASK_TYPES.DOC_SIM]: '文本相似度',
} as const

export const TASK_STATUS_LABELS: Record<string, string> = {
  [TASK_STATUS.SUCCESS]: '已完成',
  [TASK_STATUS.RUNNING]: '进行中',
  [TASK_STATUS.PENDING]: '等待中',
  [TASK_STATUS.FAILED]: '执行失败',
  [TASK_STATUS.CANCELLED]: '已取消',
} as const

export const TASK_METADATA_MAP = {
  [TASK_TYPES.WORD_SEGMENTATION]: {
    id: 'word-segmentation',
    title: '分词与统计',
    description: '对上传的文本内容进行自动分词处理，并完成词频、词云等相关统计分析与展示。',
    icon: 'ApiOutlined',
    path: '/apps/task?taskType=SEGMENTATION',
  },
  [TASK_TYPES.TF_IDF]: {
    id: 'tf-idf',
    title: 'TF-IDF',
    description: '基于 TF-IDF 算法提取每篇文档的关键词，输出词云、高频条形图与关键词明细。',
    icon: 'TagsOutlined',
    path: '/apps/task?taskType=TF_IDF',
  },
  [TASK_TYPES.DOC_SIM]: {
    id: 'doc-similarity',
    title: '文本相似度',
    description: '计算文本两两之间的相似程度，并输出相似度矩阵、热力图以及相关明细结果。',
    icon: 'CopyOutlined',
    path: '/apps/task?taskType=DOC_SIM',
  },
  [TASK_TYPES.SENTIMENT]: {
    id: 'sentiment-analysis',
    title: '情感分析与计算',
    description: '对上传文本进行情感识别与计算分析，并结合图表展示情感挖掘和结果可视化。',
    icon: 'SmileOutlined',
    path: '/apps/task?taskType=SENTIMENT',
  },
  [TASK_TYPES.SENTIMENT_CLASSIFICATION]: {
    id: 'sentiment-classification',
    title: '情感分类',
    description: '将文本内容划分为积极、中性、消极三种情感类别，并输出对应分类分析结果。',
    icon: 'SmileOutlined',
    path: '/apps/task?taskType=SENTIMENT_CLASSIFICATION',
  },
  [TASK_TYPES.CO_OCCURRENCE]: {
    id: 'co-occurrence',
    title: '语义共现网络',
    description: '对文本中的词语关系进行挖掘，构建语义共现网络，并生成可视化关联图谱展示。',
    icon: 'DeploymentUnitOutlined',
    path: '/apps/task?taskType=CO_OCCURRENCE',
  },
  [TASK_TYPES.TOPIC_OCCURRENCE]: {
    id: 'topic-occurrence',
    title: '主题共现网络',
    description: '对文本中的主题关系进行分析，构建主题共现网络，并输出可视化图谱结果。',
    icon: 'ApartmentOutlined',
    path: '/apps/task?taskType=TOPIC_OCCURRENCE',
  },
  [TASK_TYPES.TEXT_SUMMARY]: {
    id: 'text-summary',
    title: '文本摘要',
    description: '对上传文本进行核心信息提取，自动生成摘要内容，用来供下游任务分析。',
    icon: 'ScissorOutlined',
    path: '/apps/task?taskType=TEXT_SUMMARY',
  },
  [TASK_TYPES.TEXT_CLASSIFICATION]: {
    id: 'text-classification',
    title: '文本分类',
    description: '对不同文本内容进行自动识别与分类处理，并结合模型完成分类分析与结果展示。',
    icon: 'FileTextOutlined',
    path: '/apps/task?taskType=TEXT_CLASSIFICATION',
  },
  [TASK_TYPES.NEWS_CLASSIFICATION]: {
    id: 'news-classification',
    title: '新闻主题分类',
    description: '针对新闻文本内容进行主题识别与分类分析，帮助快速完成新闻主题归类整理。',
    icon: 'SoundOutlined',
    path: '/apps/task?taskType=NEWS_CLASSIFICATION',
  },
}