package com.ywllab.nemo.constant

enum class SubscriptionFeature(
    val title: String,
    val description: String,
    val requireToken: Boolean = false
) {
    // 图表可视化
    CHART_ALL("全部图表类型", "支持使用40+在线可视化图表"),

    // 分词服务
    APP_ALL("应用中心-计算服务", "支持应用中心8+计算任务"),
    APP_TOKEN("应用中心-大模型TOKEN", "支持使用计算任务LLMs, 含10万Token/月 "),

    // AI智能体
    AGENT("DataAgent", "支持数据故事 Storytelling 模块", true),

    // AI智能体-私有部署版的配置
    PRIVATE_CHART("PRIVATE-图表可视化", "支持在线数据可视化"),
    PRIVATE_CHART_SUMMARIZE("PRIVATE-图标解读", "支持调用数据解读", true),
    PRIVATE_APP_ALL("PRIVATE-计算服务", "支持应用中心计算任务"),
    PRIVATE_DATA_AGENT("PRIVATE-DataAgent", "支持使用 Data Agent"),
    PRIVATE_AGENT("PRIVATE-数据故事", "支持数据故事 Storytelling 模块", false),
    PRIVATE_PRO_SERVICE("PRIVATE-专家服务", "支持专家服务"),
}
