from utils.utils import download_excel_data, upload_excel_data, GLOBAL_CONFIG
import pandas as pd
import jieba
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def compute_document_similarity(user_data_oss_path, user_selected_stopword_names, user_stopwords_path):
    try:
        df_user_data = download_excel_data(user_data_oss_path)
        documents = df_user_data['text'].tolist()
        doc_ids = df_user_data.index.tolist() if 'id' not in df_user_data.columns else df_user_data['id'].tolist()
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

    default_SETTING_STOPWORDS = ['，', '。', '！', '？', '、', '；', '：', '（', '）', '【', '】', '《', '》', '“', '”', '‘', '’']
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

    similarity_matrix = cosine_similarity(tfidf_matrix)
    
    n_docs = len(documents)
    similarity_results = []
    
    for i in range(n_docs):
        for j in range(i + 1, n_docs):
            similarity_results.append({
                'doc_id_1': doc_ids[i] if isinstance(doc_ids[i], (int, str)) else i + 1,
                'doc_id_2': doc_ids[j] if isinstance(doc_ids[j], (int, str)) else j + 1,
                'similarity_score': float(similarity_matrix[i, j])
            })
    
    similarity_results_df = pd.DataFrame(similarity_results)
    similarity_results_df['similarity_score'] = similarity_results_df['similarity_score'].round(4)
    similarity_results_df = similarity_results_df.sort_values(by='similarity_score', ascending=False)

    result_all = upload_excel_data(similarity_results_df.head(10000), 'doc_sim')
    if result_all['message'] != 'OK':
        return {'message': f"上传文档相似度数据失败: {result_all['message']}"}

    top_similar_pairs = similarity_results_df.head(1000)
    CHART_top_pairs = top_similar_pairs[['doc_id_1', 'doc_id_2', 'similarity_score']]
    CHART_top_pairs_RE = upload_excel_data(CHART_top_pairs, 'doc_sim')
    if CHART_top_pairs_RE['message'] != 'OK':
        return {'message': f"上传相似度图表数据失败: {CHART_top_pairs_RE['message']}"}

    doc_id_labels = [doc_ids[i] if isinstance(doc_ids[i], (int, str)) else f'doc_{i + 1}' for i in range(n_docs)]
    
    similarity_matrix_df = pd.DataFrame(similarity_matrix, index=doc_id_labels, columns=doc_id_labels)
    similarity_matrix_df.index.name = 'doc_sim'

    # 重置 index 以保留为列
    similarity_matrix_df = similarity_matrix_df.reset_index()
    similarity_matrix_df = similarity_matrix_df.round(4)
    result_matrix = upload_excel_data(similarity_matrix_df, 'doc_sim')
    
    
    if result_matrix['message'] != 'OK':
        return {'message': f"上传相似度矩阵数据失败: {result_matrix['message']}"}

    summary_stats = {
        'total_documents': n_docs,
        'total_pairs': len(similarity_results),
        'avg_similarity': round(float(np.mean(similarity_matrix[np.triu_indices(n_docs, k=1)])), 4),
        'max_similarity': round(float(np.max(similarity_matrix[np.triu_indices(n_docs, k=1)])), 4),
        'min_similarity': round(float(np.min(similarity_matrix[np.triu_indices(n_docs, k=1)])), 4)
    }
    result_summary = upload_excel_data(pd.DataFrame(summary_stats, index=['summary']),  'doc_sim')
    if result_summary['message'] != 'OK':
        return {'message': f"上传相似度摘要数据失败: {result_summary['message']}"}
    
    
    
    return {
        'message': 'OK',
        'data': {
            'files': [
                {'name': 'all_results', 'path': result_all['file_name']},
                {'name': 'table', 'path': CHART_top_pairs_RE['file_name']},
                {'name': 'matrix_heatmap', 'path': result_matrix['file_name']},
                {'name': 'summary', 'path': result_summary['file_name']}
            ],
            'summary': summary_stats
        }
    }
