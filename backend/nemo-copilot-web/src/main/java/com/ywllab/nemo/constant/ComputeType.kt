package com.ywllab.nemo.constant

/**
 * 计算类型枚举
 */
enum class ComputeType(val desc: String, val category: ExecCategory) {
    // ML
    SEGMENTATION("分词与统计", ExecCategory.ML_MODEL),
    CO_OCCURRENCE("词共现网络", ExecCategory.ML_MODEL),
    SENTIMENT("情感计算", ExecCategory.ML_MODEL),
    TOPIC_OCCURRENCE("话题共现网络", ExecCategory.ML_MODEL),
    TF_IDF("TF-IDF计算", ExecCategory.ML_MODEL),
    DOC_SIM("文档相似度计算", ExecCategory.ML_MODEL),
    FREQUENT_ITEMSET("频繁项集挖掘", ExecCategory.ML_MODEL),
    FREQUENT_ITEMSET_SPLIT("频繁项集挖掘(分隔符模式)", ExecCategory.ML_MODEL),

    // LLM
    CHART_INTERPRET("图表解读", ExecCategory.LLM),
    TRANSLATE_TEXT("文本翻译", ExecCategory.LLM),
    DATA_AGENT("数据智能体", ExecCategory.LLM),

    TEXT_SUMMARY("文本摘要", ExecCategory.LLM),
    SENTIMENT_CLASSIFICATION("情感分类", ExecCategory.LLM),
    TEXT_CLASSIFICATION("文本分类", ExecCategory.LLM),
    NEWS_CLASSIFICATION("新闻主题分类", ExecCategory.LLM),

    ;

    /**
     * 计算schema类型
     */
    enum class SchemaType {
        ML_COMPUTE_API,
        OPENAI_RESPONSE_API
    }
}
