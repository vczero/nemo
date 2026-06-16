from utils.utils import download_excel_data, upload_excel_data, GLOBAL_CONFIG
import pandas as pd
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer
from collections import Counter

def compute_tf_idf(user_data_oss_path, user_selected_stopword_names, user_stopwords_path, top_n=10):
    try:
        df_user_data = download_excel_data(user_data_oss_path)
        documents = df_user_data['text'].tolist()
    except Exception as e:
        return {'message': f'下载或读取用户数据的Excel失败，请检查是否包含text列或者文件是否存在: {e}'}

    if len(df_user_data) > GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT'):
        return {'message': 'Excel 文件中的数据量过大，请上传不超过' + str(GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT')) + '行的数据; 或者分批次数据处理。'}

    stopwords_all_dfs = []
    if user_stopwords_path:
        try:
            user_stopwords = download_excel_data(user_stopwords_path)
            stopwords_all_dfs.append(user_stopwords)
        except Exception as e:
            return {'message': f'下载或读取用户自定义词的Excel失败，请检查文件名称是否存在: {e}'}

    selected_stopword_names = user_selected_stopword_names.split('@') if user_selected_stopword_names else []
    
    for name in selected_stopword_names:
        path = f'stopwords/{name}.txt'
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.read().splitlines()
        temp_stopwords = pd.DataFrame({'text': lines})
        stopwords_all_dfs.append(temp_stopwords)
    
    if stopwords_all_dfs:
        STWORDS = pd.concat(stopwords_all_dfs, ignore_index=True, sort=False)
        ALL_STOPWORDS_SET = set(STWORDS['text'].tolist())
    else:
        ALL_STOPWORDS_SET = set()

    default_SETTING_STOPWORDS = ['，', '。', '！', '？', '、', '；', '：', '（', '）', '【', '】', '《', '》', 
    '“', '”', '‘', '’', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
    ALL_STOPWORDS_SET = ALL_STOPWORDS_SET.union(set(default_SETTING_STOPWORDS))

    def tokenize(text):
        words = []
        for word in jieba.cut(text):
            if word.strip() and word not in ALL_STOPWORDS_SET:
                words.append(word)
        return words

    tokenized_docs = [' '.join(tokenize(doc)) for doc in documents]
    
    tfidf = TfidfVectorizer(token_pattern=r'(?u)\b\w+\b')
    tfidf_matrix = tfidf.fit_transform(tokenized_docs)
    feature_names = tfidf.get_feature_names_out()

    all_results = []
    doc_top_keywords = []
    for doc_idx, doc in enumerate(documents):
        row = tfidf_matrix[doc_idx].toarray()[0]
        word_tfidf = [(feature_names[i], row[i]) for i in range(len(feature_names)) if row[i] > 0]
        word_tfidf.sort(key=lambda x: x[1], reverse=True)
        
        for word, score in word_tfidf:
            all_results.append({
                'document_index': doc_idx + 1,
                'word': word,
                'tfidf_score': score
            })
        
        for word, score in word_tfidf[:top_n]:
            doc_top_keywords.append({
                'document_index': doc_idx + 1,
                'keyword_rank': len(doc_top_keywords) - len([k for k in doc_top_keywords if k['document_index'] == doc_idx + 1]) + 1,
                'word': word,
                'tfidf_score': score
            })

    all_results_df = pd.DataFrame(all_results)
    all_results_df['tfidf_score'] = all_results_df['tfidf_score'].round(4)
    all_results_df = all_results_df.sort_values(by='tfidf_score', ascending=False)

    doc_top_keywords_df = pd.DataFrame(doc_top_keywords)
    doc_top_keywords_df['tfidf_score'] = doc_top_keywords_df['tfidf_score'].round(4)

    result_all = upload_excel_data(all_results_df.head(10000), 'tf_idf')
    if result_all['message'] != 'OK':
        return {'message': f"上传TF-IDF结果数据失败: {result_all['message']}"}

    result_doc_top = upload_excel_data(doc_top_keywords_df, 'tf_idf')
    
    if result_doc_top['message'] != 'OK':
        return {'message': f"上传文档关键词数据失败: {result_doc_top['message']}"}

    top_tfidf = all_results_df.groupby('word')['tfidf_score'].sum().reset_index()
    top_tfidf['tfidf_score'] = top_tfidf['tfidf_score'].round(4)
    top_tfidf = top_tfidf.sort_values(by='tfidf_score', ascending=False).head(200)
    CHART_wordcloud = top_tfidf[['word', 'tfidf_score']]
    CHART_wordcloud_RE = upload_excel_data(CHART_wordcloud, 'tf_idf')
    if CHART_wordcloud_RE['message'] != 'OK':
        return {'message': f"上传词云图数据失败: {CHART_wordcloud_RE['message']}"}

    CHART_horizontal_bar = top_tfidf.head(20)[['word', 'tfidf_score']]
    CHART_horizontal_bar_RE = upload_excel_data(CHART_horizontal_bar, 'tf_idf')
    if CHART_horizontal_bar_RE['message'] != 'OK':
        return {'message': f"上传柱状图数据失败: {CHART_horizontal_bar_RE['message']}"}

    CHART_table = all_results_df.head(1000).copy()
    CHART_table_RE = upload_excel_data(CHART_table, 'tf_idf')
    if CHART_table_RE['message'] != 'OK':
        return {'message': f"上传表格数据失败: {CHART_table_RE['message']}"}

    

    return {
        'message': 'OK',
        'data': {
            'files':[
                {'name': 'all_results', 'path': result_all['file_name']},
                {'name': 'doc_top_keywords', 'path': result_doc_top['file_name']},
                {'name': 'wordcloud', 'path': CHART_wordcloud_RE['file_name']},
                {'name': 'horizontal_bar', 'path': CHART_horizontal_bar_RE['file_name']},
                {'name': 'table', 'path': CHART_table_RE['file_name']}
            ],
            'summary': {
                'total_words': len(feature_names),
                'total_documents': len(documents)
            }
        }
    }
