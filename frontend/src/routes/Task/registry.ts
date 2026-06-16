import { lazy, type ComponentType } from 'react'
import { TASK_TYPES, type TTaskType } from '@/constants/ml_task'

export interface TaskRegistryEntry {
  ConfigSteps: ComponentType<any>
  Report: ComponentType<any>
}

const registry: Partial<Record<TTaskType, TaskRegistryEntry>> = {
  [TASK_TYPES.WORD_SEGMENTATION]: {
    ConfigSteps: lazy(() => import('@/routes/Task/WordSegmentation/ConfigSteps')),
    Report: lazy(() => import('@/routes/Task/WordSegmentation/Report')),
  },
  [TASK_TYPES.CO_OCCURRENCE]: {
    ConfigSteps: lazy(() => import('@/routes/Task/CoOccurrence/ConfigSteps')),
    Report: lazy(() => import('@/routes/Task/CoOccurrence/Report')),
  },
  [TASK_TYPES.SENTIMENT]: {
    ConfigSteps: lazy(() => import('@/routes/Task/SentimentAnalysis/ConfigSteps')),
    Report: lazy(() => import('@/routes/Task/SentimentAnalysis/Report')),
  },
  [TASK_TYPES.SENTIMENT_CLASSIFICATION]: {
    ConfigSteps: lazy(
      () => import('@/routes/Task/SentimentClassification/ConfigSteps'),
    ),
    Report: lazy(() => import('@/routes/Task/SentimentClassification/Report')),
  },
  [TASK_TYPES.TEXT_SUMMARY]: {
    ConfigSteps: lazy(() => import('@/routes/Task/TextSummary/ConfigSteps')),
    Report: lazy(() => import('@/routes/Task/TextSummary/Report')),
  },
  [TASK_TYPES.TOPIC_OCCURRENCE]: {
    ConfigSteps: lazy(() => import('@/routes/Task/TopicOccurrence/ConfigSteps')),
    Report: lazy(() => import('@/routes/Task/TopicOccurrence/Report')),
  },
  [TASK_TYPES.NEWS_CLASSIFICATION]: {
    ConfigSteps: lazy(
      () => import('@/routes/Task/NewsClassification/ConfigSteps'),
    ),
    Report: lazy(() => import('@/routes/Task/NewsClassification/Report')),
  },
  [TASK_TYPES.TEXT_CLASSIFICATION]: {
    ConfigSteps: lazy(
      () => import('@/routes/Task/TextClassification/ConfigSteps'),
    ),
    Report: lazy(() => import('@/routes/Task/TextClassification/Report')),
  },
  [TASK_TYPES.TF_IDF]: {
    ConfigSteps: lazy(() => import('@/routes/Task/TFIDF/ConfigSteps')),
    Report: lazy(() => import('@/routes/Task/TFIDF/Report')),
  },
  [TASK_TYPES.DOC_SIM]: {
    ConfigSteps: lazy(() => import('@/routes/Task/DocSimilarity/ConfigSteps')),
    Report: lazy(() => import('@/routes/Task/DocSimilarity/Report')),
  },
}

export function getTaskRegistry(taskType: string): TaskRegistryEntry | null {
  if (!taskType || typeof taskType !== 'string') {
    return null
  }
  const taskTypeUpper = taskType.toUpperCase() as TTaskType
  return registry[taskTypeUpper] ?? null
}
