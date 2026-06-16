from utils.utils import download_excel_data, upload_excel_data, GLOBAL_CONFIG
import pandas as pd
from snownlp import SnowNLP


def compute_sentiment_scores(excel_filename, neg_threshold=0.4, neu_threshold=0.6, pos_threshold=1.0):
    try:
        neg_threshold = float(neg_threshold)
        neu_threshold = float(neu_threshold)
        pos_threshold = float(pos_threshold)
    except Exception:
        return {'message': '阈值必须为数字。'}

    if not (0 <= neg_threshold < neu_threshold < pos_threshold <= 1):
        return {'message': '阈值必须满足 0 <= neg_threshold < neu_threshold < pos_threshold <= 1。'}

    try:
        df = download_excel_data(excel_filename)
    except Exception as e:
        return {'message': f'下载或读取用户数据的Excel失败，请检查文件名称是否存在: {e}'}

    if 'id' not in df.columns or 'text' not in df.columns:
        return {'message': 'Excel 文件必须包含 id 和 text 两列。'}

    if len(df) == 0:
        return {'message': 'Excel 文件中没有数据。'}

    if len(df) > GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT'):
        return {'message': 'Excel 文件中的数据量过大，请上传不超过' + str(GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT')) + '行的数据; 或者分批次数据处理。'}

    results = []

    for _, row in df[['id', 'text']].iterrows():
        record_id = row['id']
        text = str(row['text'] or '')

        # 空文本默认中性 0.5
        if not text.strip():
            score = 0.5
        else:
            score = float(SnowNLP(text).sentiments)

        if score < neg_threshold:
            label = 'negative'
            results.append({'id': record_id, 'text': text, 'score': score, 'label': label})
        elif score < neu_threshold:
            label = 'neutral'
            results.append({'id': record_id, 'text': text, 'score': score, 'label': label})
        else:
            label = 'positive'
            results.append({'id': record_id, 'text': text, 'score': score, 'label': label})

    
    # 转df
    results_df = pd.DataFrame(results)
    total = len(results_df)
    if total == 0:
        ratios = {'positive': 0, 'neutral': 0, 'negative': 0}
    else:
        # ratios = {
        #     'positive': len(results_df[results_df['label'] == 'positive']) / total,
        #     'neutral': len(results_df[results_df['label'] == 'neutral']) / total,
        #     'negative': len(results_df[results_df['label'] == 'negative']) / total,
        # }
        ratios = {
            'positive': len(results_df[results_df['label'] == 'positive']),
            'neutral': len(results_df[results_df['label'] == 'neutral']),
            'negative': len(results_df[results_df['label'] == 'negative']),
        }
   
    # 结果处理
    # 将所有结果上传到OSS
    result_all = upload_excel_data(results_df, 'sentiment')
    if result_all['message'] != 'OK':
        return {'message': f"上传情感分析结果失败: {result_all['message']}"}

    # 截取前端可用户展示前300条数据
    CHART_Table = results_df.head(1000)
    CHART_Table_RE = upload_excel_data(CHART_Table, 'sentiment')
    if CHART_Table_RE['message'] != 'OK':  
        return {'message': f"上传情感分析结果失败: {CHART_Table_RE['message']}"}

    # donut_chart
    CHART_donut_chart = pd.DataFrame({
        'category': ['positive', 'neutral', 'negative'],
        'ratio': [ratios['positive'], ratios['neutral'], ratios['negative']]
    })
    CHART_donut_chart_RE = upload_excel_data(CHART_donut_chart, 'sentiment')
    if CHART_donut_chart_RE['message'] != 'OK':
        return {'message': f"上传情感分析结果失败: {CHART_donut_chart_RE['message']}"}

    return {
        'message': 'OK',
        'data': {
            'files':[
                {'name': 'all_results', 'path': result_all['file_name']},
                {'name': 'table', 'path': CHART_Table_RE['file_name']}, 
                {'name': 'donut_chart', 'path': CHART_donut_chart_RE['file_name']}
            ],
            'summary': {
                'total_count': total
            }
        }
    }
