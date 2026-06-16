from langchain.tools import tool
from datagent.tools.file_parser.parser import parse_file
from datagent.tools.chart_server_util import fetch_chart_types, fetch_chart_guide, validate_chart_config


@tool
def get_supported_chart_types() -> str:
    """返回所有支持的图表类型列表，和适用的场景描述。"""
    return fetch_chart_types()


@tool
def get_chart_guide(chart_type: str) -> str:
    """
    获取指定图表类型的完整配置指南。

    Args:
        chart_type: 图表类型，支持：
            area, background_bar, bar, boxplot, chord, circle_packing, compare_funnel, donut,
            flow_graph, force_graph, funnel, grouped_bar, grouped_horizontal_bar, heatmap,
            highlighted_bar, histogram, horizontal_bar, horizontal_boxplot, line, map,
            matrix_heatmap, multi_line, percent_bar, percent_horizontal_bar, pie, pyramid,
            radar, relationship_graph, rounded_donut, sankey, scatter, scatter_exponential,
            scatter_linear, scatter_logarithmic, scatter_polynomial, single_axis_scatter,
            slope, smooth_line, stacked_area, stacked_bar, stacked_horizontal_bar,
            stacked_line, step_line, timeline, tornado, tree, treemap, violin, wordcloud
    """
    return fetch_chart_guide(chart_type)


@tool
def render_chart(chart_config: str, chart_data: str) -> str:
    """
    渲染图表并验证配置是否正确。

    Args:
        chart_config: 图表配置的 JSON 字符串（不含数据）
        chart_data: 图表数据，二维数组格式，首行为表头。如 [["城市","气温"],["北京",26],["上海",28]]
    Returns:
        配置正常时返回 JSON: {"ok": true, "thumbnail_oss_path": "chart/thumbnail/xxx.png"}
        配置错误时返回 JSON: {"ok": false, "error": "错误信息"}
        thumbnail_oss_path 可直接传入 create_chart/update_chart 的 thumbnail 参数
    """
    return validate_chart_config(chart_config, chart_data)


@tool
def parse_file_tool(oss_path: str) -> str:
    """
    解析本地文件（图片/Word/PDF/Excel）为 markdown 或 jsonlines 格式。
    当文件在 OSS 时使用此工具。

    Args:
        oss_path: 文件的 OSS 路径
    """
    import asyncio
    result = asyncio.run(parse_file(oss_path=oss_path))
    return f"[{result['format']}]\n{result['content']}"
