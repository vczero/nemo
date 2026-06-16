/**
 * 计算类型配置
 * 与后端 ComputeType 枚举对应
 */
export const COMPUTE_TYPE_CONFIG = {
  // ML
  SEGMENTATION: { text: '分词与统计', color: 'magenta' },
  CO_OCCURRENCE: { text: '词共现网络', color: 'red' },
  SENTIMENT: { text: '情感计算', color: 'volcano' },
  TOPIC_OCCURRENCE: { text: '话题共现网络', color: 'orange' },
  TF_IDF: { text: 'TF-IDF计算', color: 'magenta' },
  DOC_SIM: { text: '文档相似度计算', color: 'red' },
  FREQUENT_ITEMSET: { text: '频繁项集挖掘', color: 'volcano' },
  FREQUENT_ITEMSET_SPLIT: { text: '频繁项集挖掘(分隔符模式)', color: 'orange' },

  // LLM
  CHART_INTERPRET: { text: '图表解读', color: 'green' },
  TRANSLATE_TEXT: { text: '文本翻译', color: 'geekblue' },
  DATA_AGENT: { text: 'DataAgent', color: 'blue' },
  TEXT_SUMMARY: { text: '文本摘要', color: 'cyan' },
  SENTIMENT_CLASSIFICATION: { text: '情感分类', color: 'purple' },
  TEXT_CLASSIFICATION: { text: '文本分类', color: 'blue' },
  NEWS_CLASSIFICATION: { text: '新闻分类', color: 'gold' },
}

/**
 * 计算类型选项列表
 */
export const COMPUTE_TYPE_OPTIONS = [
  { value: 'SEGMENTATION', label: '分词与统计' },
  { value: 'CO_OCCURRENCE', label: '词共现网络' },
  { value: 'SENTIMENT', label: '情感计算' },
  { value: 'TOPIC_OCCURRENCE', label: '话题共现网络' },
  { value: 'TF_IDF', label: 'TF-IDF计算' },
  { value: 'DOC_SIM', label: '文档相似度计算' },
  { value: 'FREQUENT_ITEMSET', label: '频繁项集挖掘' },
  { value: 'FREQUENT_ITEMSET_SPLIT', label: '频繁项集挖掘(分隔符模式)' },
  { value: 'CHART_INTERPRET', label: '图表解读' },
  { value: 'TRANSLATE_TEXT', label: '文本翻译' },
  { value: 'DATA_AGENT', label: 'DataAgent' },
  { value: 'TEXT_SUMMARY', label: '文本摘要' },
  { value: 'SENTIMENT_CLASSIFICATION', label: '情感分类' },
  { value: 'TEXT_CLASSIFICATION', label: '文本分类' },
  { value: 'NEWS_CLASSIFICATION', label: '新闻分类' },
]

/**
 * LLM类型的计算类型
 */
export const LLM_COMPUTE_TYPES = [
  'CHART_INTERPRET',
  'TRANSLATE_TEXT',
  'DATA_AGENT',
  'TEXT_SUMMARY',
  'SENTIMENT_CLASSIFICATION',
  'TEXT_CLASSIFICATION',
  'NEWS_CLASSIFICATION',
]
