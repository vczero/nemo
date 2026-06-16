import pandas as pd
import numpy as np
from itertools import combinations
from collections import Counter
from utils.utils import download_excel_data, upload_excel_data, GLOBAL_CONFIG


def build_topic_co_occurrence_network(excel_filename, delimiter='@'):
    try:
        df = download_excel_data(excel_filename)
    except Exception as e:
        return {'message': f'下载或读取用户数据的Excel失败，请检查文件名称是否存在: {e}'}

    if 'text' not in df.columns:
        return {'message': 'Excel文件中缺少"text"列，请检查文件格式。'}

    if len(df) > GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT'):
        return {'message': 'Excel 文件中的数据量过大，请上传不超过' + str(GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT')) + '行的数据; 或者分批次数据处理。'}

    data = df[['text']].dropna().copy()
    data['topics'] = data['text'].apply(
        lambda x: list(dict.fromkeys([i.strip() for i in str(x).split(delimiter) if i.strip()]))
    )
    topic_counter = Counter()
    for topics in data['topics']:
        topic_counter.update(topics)
    topic_freq = pd.DataFrame( topic_counter.items(), columns=['topic', 'freq']).sort_values('freq', ascending=False)
    freq_result = topic_freq.to_dict(orient='records')

    # 构建共现网络
    co_counter = Counter()
    for topics in data['topics']:
        if len(topics) >= 2:
            for pair in combinations(sorted(topics), 2):
                co_counter[pair] += 1

    co_df = pd.DataFrame([(a, b, w) for (a, b), w in co_counter.items()], columns=['topic1', 'topic2', 'weight']).sort_values('weight', ascending=False)
    
    co_df_rev = co_df.rename(columns={
        'topic1': 'topic2',
        'topic2': 'topic1'
    })[['topic1', 'topic2', 'weight']]

    co_df_sym = pd.concat([co_df, co_df_rev], ignore_index=True)
    co_matrix = co_df_sym.pivot_table(
        index='topic1',
        columns='topic2',
        values='weight',
        aggfunc='sum',
        fill_value=0
    )
  
    co_matrix = co_matrix.reset_index()

    # 所有
    result_all = upload_excel_data(co_matrix, 'topic_occurrence')
    if result_all['message'] != 'OK':
        return {'message': f"上传主题共现结果失败: {result_all['message']}"}

  
   # 表格
    CHART_Table_RE = upload_excel_data(co_matrix, 'topic_occurrence')
    if CHART_Table_RE['message'] != 'OK':  
        return {'message': f"上传主题共现结果失败: {CHART_Table_RE['message']}"}

    # 热力图
    CHART_Heatmap_RE = upload_excel_data(co_matrix, 'topic_occurrence')
    if CHART_Heatmap_RE['message'] != 'OK':  
        return {'message': f"上传主题共现结果失败: {CHART_Heatmap_RE['message']}"}

    # 力引导图
    CHART_ForceDirected_RE = upload_excel_data(co_df, 'topic_occurrence')
    if CHART_ForceDirected_RE['message'] != 'OK':  
        return {'message': f"上传主题共现结果失败: {CHART_ForceDirected_RE['message']}"}

    return {
        'message': 'OK',
        'data': {
            'files':[
                {
                    'name': 'all_results',
                    'path': result_all['file_name']
                },
                {
                    'name': 'table',
                    'path': CHART_Table_RE['file_name']
                },
                {
                    'name': 'matrix_heatmap',
                    'path': CHART_Heatmap_RE['file_name']
                },
                {
                    'name': 'force_directed_graph',
                    'path': CHART_ForceDirected_RE['file_name']
                }
            ],
            'summary': {
                'category_count': len(freq_result)
            }
        }
    }


