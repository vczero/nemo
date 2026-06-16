from utils.utils import download_excel_data, upload_excel_data, GLOBAL_CONFIG
import pandas as pd
import jieba
import jieba.posseg as pseg
import snownlp
from collections import Counter

def perform_segmentation(user_data_oss_path, user_selected_stopword_names, user_stopwords_path, seg_model):
    # 从oss下载用户数据和用户上传的数据
    try:
        df_user_data = download_excel_data(user_data_oss_path)
        # user_data_text = df_user_data['text'].tolist()[0] 
        user_data_text = ' '.join(df_user_data['text'].tolist())
    except Exception as e:
        return {'message': f'下载或读取用户数据的Excel失败，请检查是否包含text列或者文件是否存在: {e}'}


    if len(df_user_data) > GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT'):
        return {'message': 'Excel 文件中的数据量过大，请上传不超过' + str(GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT')) + '行的数据; 或者分批次数据处理。'}

    # 合并停用词：用户选择的停用词库 + 用户上传的停用词（可选）
    stopwords_all_dfs = []
    # 从oss下载用户自定义词和用户上传的停用词（可选）
   
    if user_stopwords_path:
        try:
            user_stopwords = download_excel_data(user_stopwords_path)
            stopwords_all_dfs.append(user_stopwords)
        except Exception as e:
            return {'message': f'下载或读取用户自定义词的Excel失败，请检查文件名称是否存在: {e}'}

    # 解析用户选择的停用词库名称
    selected_stopword_names = user_selected_stopword_names.split('@') if user_selected_stopword_names else []
   
    for name in selected_stopword_names:
        path = f'stopwords/{name}.txt'
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.read().splitlines()
        temp_stopwords = pd.DataFrame({'text': lines})
        stopwords_all_dfs.append(temp_stopwords)
    
    STWORDS = pd.concat(stopwords_all_dfs, ignore_index=True, sort=False)
    # 中文用户默认标点过滤
    default_SETTING_STOPWORDS = ['，', '。', '！', '？', '、', '；', '：', '（', '）', '【', '】', '《', '》', '“', '”', '‘', '’']
    ALL_STOPWORDS_SET = set(STWORDS['text'].tolist() + default_SETTING_STOPWORDS)

    
    if seg_model == 'Jieba':
        words = []
        pos_tags = []
        for word, flag in pseg.cut(user_data_text):
            if word.strip() and word not in ALL_STOPWORDS_SET:
                words.append(word)
                pos_tags.append(flag)
    elif seg_model == 'SnowNLP':
        words = []
        pos_tags = []
        for word, tag in snownlp.SnowNLP(user_data_text).tags:
            if word.strip() and word not in ALL_STOPWORDS_SET:
                words.append(word)
                pos_tags.append(tag)

    word_freq = Counter(words)

    # 记录每个词的词性（取第一个出现的）
    word_to_pos = {}
    for word, pos in zip(words, pos_tags):
        if word not in word_to_pos:
            word_to_pos[word] = pos

    integrated_result = [{'word': word, 'POS': word_to_pos[word], 'frequency': freq} for word, freq in word_freq.items()]
    integrated_result = sorted(integrated_result, key=lambda x: x['frequency'], reverse=True)

    integrated_result_df = pd.DataFrame(integrated_result)
    integrated_result_df = integrated_result_df.sort_values(by='frequency', ascending=False)

    # 结果处理
    # 将所有结果上传到OSS
    result_all = upload_excel_data(integrated_result_df.head(10000), 'segmentation')
    if result_all['message'] != 'OK':
        return {'message': f"上传分词图表数据失败: {result_all['message']}"}

    # 词云图 excel数据准备（前200条）
    CHART_wordcloud = integrated_result_df.head(200)[['word', 'frequency']]
    CHART_wordcloud_RE = upload_excel_data(CHART_wordcloud, 'segmentation')
    if CHART_wordcloud_RE['message'] != 'OK':
        return {'message': f"上传分词图表数据失败: {CHART_wordcloud_RE['message']}"}

    # 词频柱状图 excel数据准备（前20条）
    CHART_horizontal_bar = integrated_result_df.head(20)[['word', 'frequency']]
    CHART_horizontal_bar_RE = upload_excel_data(CHART_horizontal_bar, 'segmentation')
    if CHART_horizontal_bar_RE['message'] != 'OK':
        return {'message': f"上传分词图表数据失败: {CHART_horizontal_bar_RE['message']}"}

    # 截取前端可用户展示前300条数据
    CHART_tabel = integrated_result_df.head(1000).copy()
    total_frequency = CHART_tabel['frequency'].sum()
    if total_frequency != 0:
        CHART_tabel['rate'] = CHART_tabel['frequency'] / total_frequency
    else:
        CHART_tabel['rate'] = 0
    CHART_tabel_RE = upload_excel_data(CHART_tabel, 'segmentation')
    if CHART_tabel_RE['message'] != 'OK':
        return {'message': f"上传分词图表数据失败: {CHART_tabel_RE['message']}"}

    return {
        'message': 'OK',
        'data': {
            'files':[
                {'name': 'all_results', 'path': result_all['file_name']},
                {'name': 'wordcloud', 'path': CHART_wordcloud_RE['file_name']},
                {'name': 'horizontal_bar', 'path': CHART_horizontal_bar_RE['file_name']},
                {'name': 'table', 'path': CHART_tabel_RE['file_name']}
            ],
            'summary': {
                'total_count': len(integrated_result_df),
            }
        }
    }