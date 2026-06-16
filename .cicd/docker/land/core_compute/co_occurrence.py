from utils.utils import download_excel_data, upload_excel_data, GLOBAL_CONFIG
import jieba
from collections import Counter, defaultdict
from itertools import combinations, islice
import pandas as pd


def build_co_occurrence_network(excel_filename, min_frequency=1, top_n=500):
    # 确保参数类型正确，避免类型比较错误
    min_frequency = int(min_frequency)
    top_n = int(top_n) if top_n is not None else None
    if top_n > 1000:
        top_n = 1000  # 前端展示限制最多1000条数据
    
    try:
        df = download_excel_data(excel_filename)
    except Exception as e:
        return {'message': f'下载或读取用户数据的Excel失败，请检查文件名称是否存在: {e}'}

    if 'text' not in df.columns:
        return {'message': 'Excel文件中缺少"text"列，请检查文件格式。'}

    if len(df) > GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT'):
        return {'message': 'Excel 文件中的数据量过大，请上传不超过' + str(GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT')) + '行的数据; 或者分批次数据处理。'}

    co_counts = Counter()
    update = co_counts.update

    default_SETTING_STOPWORDS = ['，', '。', '！', '？', '、', '；', '：', '（', '）', '【', '】', '《', '》', '“', '”', '‘', '’']
    path = f'stopwords/哈工大停用词表.txt'
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.read().splitlines() + default_SETTING_STOPWORDS
    temp_stopwords = pd.DataFrame({'text': lines})

    ALL_STOPWORDS_SET = set(temp_stopwords['text'].tolist())

    for text in df['text'].fillna(''):
        if not text:
            continue

        # 单次遍历：去空白、去停用词、去重
        unique_tokens = set()
        for w in jieba.lcut(text):
            w = w.strip()
            if w and w not in ALL_STOPWORDS_SET:
                unique_tokens.add(w)

        # 少于2个词，无法组成pair
        if len(unique_tokens) < 2:
            continue

        # 排序一次，保证 combinations 生成的pair天然有序
        tokens = sorted(unique_tokens)

        # 批量更新，比循环里逐个 += 1 更快更简洁
        update(combinations(tokens, 2))
     
    # 先按最小频次过滤
    filtered_pairs = [(pair, freq) for pair, freq in co_counts.items() if freq >= min_frequency]
    if len(filtered_pairs) == 0:
        return {'message': '没有满足条件的词共现对, 最小共现频次设置过高。请重新设置'}
    top_pairs_df = pd.DataFrame(filtered_pairs, columns=['pair', 'count'])
    top_pairs_df = top_pairs_df.sort_values(by='count', ascending=False)
    top_pairs_df[['word1', 'word2']] = pd.DataFrame(top_pairs_df['pair'].tolist(), index=top_pairs_df.index)
    top_pairs_df = top_pairs_df[['word1', 'word2', 'count']]
    # excel 最多支持1048576行，如果超过则截取前10000行
    # 结果处理

    # 将所有结果上传到OSS
    result_all = upload_excel_data(top_pairs_df.head(10000), 'co_occurrence')
    if result_all['message'] != 'OK':
        return {'message': f"上传词共现结果失败: {result_all['message']}"}

    # 词共现图表数据准备（前300条）
    CHART_force_directed_graph = top_pairs_df.head(top_n)
    CHART_force_directed_graph_RE = upload_excel_data(CHART_force_directed_graph, 'co_occurrence')
    if CHART_force_directed_graph_RE['message'] != 'OK':
        return {'message': f"上传词共现结果失败: {CHART_force_directed_graph_RE['message']}"}

    # 截取前端可用户展示前最多1000条数据，默认500条
    CHART_Table = top_pairs_df.head(top_n)
    CHART_Table_RE = upload_excel_data(CHART_Table, 'co_occurrence')
    if CHART_Table_RE['message'] != 'OK':  
        return {'message': f"上传词共现图表数据失败: {CHART_Table_RE['message']}"}

    return {
        'message': 'OK',
        'data': {
            'files':[
                {'name': 'all_results', 'path': result_all['file_name']},
                {'name': 'force_directed_graph', 'path': CHART_force_directed_graph_RE['file_name']}, 
                {'name': 'table', 'path': CHART_Table_RE['file_name']}],
            'summary': {
                'total_count': len(top_pairs_df),
            }
        }
    }
