package com.ywllab.nemo.constant

/**
 * 图表类型枚举
 */
enum class ChartType(val value: String) {
    LINE("line"),
    BAR("bar"),
    PIE("pie"),
    RADAR("radar"),
    SCATTER("scatter"),
    HIERARCHY("hierarchy"),
    MAP("map"),
    FUNNEL("funnel"),
    HEATMAP("heatmap"),
    SLOPE("slope"),
    CHORD("chord"),
    GRAPH("graph"),
    SANKEY("sankey"),
    TIMELINE("timeline"),
    WORDCLOUD("wordcloud"),
    VIOLIN("violin"),
    HORIZONTAL_BAR("horizontal_bar"),
    TORNADO("tornado"),
    HISTOGRAM("histogram"),
    DONUT("donut"),
    BOXPLOT("boxplot");

    companion object {
        fun fromValue(value: String): ChartType? {
            return values().find { it.value == value }
        }
    }
}
