from utils.utils import download_excel_data, upload_excel_data, GLOBAL_CONFIG
import pandas as pd
from collections import defaultdict
import itertools

def apriori(transactions, min_support):
    item_counts = defaultdict(int)
    for transaction in transactions:
        for item in transaction:
            item_counts[item] += 1
    
    n_transactions = len(transactions)
    min_count = min_support * n_transactions
    
    frequent_itemsets = []
    current_itemsets = [[item] for item, count in item_counts.items() if count >= min_count]
    
    k = 1
    while current_itemsets:
        frequent_itemsets.extend(current_itemsets)
        
        candidate_itemsets = []
        unique_items = sorted(set(item for itemset in current_itemsets for item in itemset))
        
        for itemsets in itertools.combinations(current_itemsets, 2):
            combined = sorted(list(set(itemsets[0] + itemsets[1])))
            if len(combined) == k + 1:
                candidate_itemsets.append(combined)
        
        candidate_itemsets = [list(x) for x in set(tuple(x) for x in candidate_itemsets)]
        
        candidate_counts = defaultdict(int)
        for transaction in transactions:
            for candidate in candidate_itemsets:
                if set(candidate).issubset(set(transaction)):
                    candidate_counts[tuple(candidate)] += 1
        
        current_itemsets = [list(itemset) for itemset, count in candidate_counts.items() if count >= min_count]
        k += 1
    
    results = []
    for itemset in frequent_itemsets:
        count = sum(1 for transaction in transactions if set(itemset).issubset(set(transaction)))
        support = count / n_transactions
        results.append({
            'itemset': ','.join(itemset),
            'item_count': len(itemset),
            'support_count': count,
            'support': support
        })
    
    return sorted(results, key=lambda x: (-x['support'], -x['item_count']))

def compute_frequent_itemset_split(user_data_oss_path, min_support=0.1, delimiter='@'):
    try:
        df_user_data = download_excel_data(user_data_oss_path)
        documents = df_user_data['text'].tolist()
    except Exception as e:
        return {'message': f'下载或读取用户数据的Excel失败，请检查是否包含text列或者文件是否存在: {e}'}

    if len(df_user_data) > GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT'):
        return {'message': 'Excel 文件中的数据量过大，请上传不超过' + str(GLOBAL_CONFIG.get('USER_RAW_DATA_LIMIT')) + '行的数据; 或者分批次数据处理。'}

    def split_items(text):
        items = [item.strip() for item in text.split(delimiter) if item.strip()]
        return items

    transactions = [split_items(doc) for doc in documents]
    
    if not transactions or all(len(t) == 0 for t in transactions):
        return {'message': '没有有效的项目数据，请检查数据格式'}
    
    frequent_itemsets = apriori(transactions, min_support)
    
    if not frequent_itemsets:
        return {'message': '没有找到满足最小支持度的频繁项集'}
    
    results_df = pd.DataFrame(frequent_itemsets)
    
    result_all = upload_excel_data(results_df.head(10000), 'frequent_itemset_split')
    if result_all['message'] != 'OK':
        return {'message': f"上传频繁项集数据失败: {result_all['message']}"}

    single_items = results_df[results_df['item_count'] == 1].sort_values(by='support', ascending=False).head(50)
    CHART_single = single_items[['itemset', 'support']]
    CHART_single_RE = upload_excel_data(CHART_single, 'frequent_itemset_split')
    if CHART_single_RE['message'] != 'OK':
        return {'message': f"上传单项集图表数据失败: {CHART_single_RE['message']}"}

    multi_items = results_df[results_df['item_count'] > 1].sort_values(by='support', ascending=False).head(100)
    CHART_multi = multi_items[['itemset', 'item_count', 'support']]
    CHART_multi_RE = upload_excel_data(CHART_multi, 'frequent_itemset_split')
    if CHART_multi_RE['message'] != 'OK':
        return {'message': f"上传多项集图表数据失败: {CHART_multi_RE['message']}"}

    summary_stats = {
        'total_transactions': len(transactions),
        'total_itemsets': len(frequent_itemsets),
        'max_item_count': max(itemset['item_count'] for itemset in frequent_itemsets),
        'min_support': min_support,
        'delimiter': delimiter
    }
    
    summary_df = pd.DataFrame(list(summary_stats.items()), columns=['metric', 'value'])
    result_summary = upload_excel_data(summary_df, 'frequent_itemset_split')
    if result_summary['message'] != 'OK':
        return {'message': f"上传汇总数据失败: {result_summary['message']}"}

   

    return {
        'message': 'OK',
        'data': {
            'files': [
                {'name': 'all_results', 'path': result_all['file_name']},
                {'name': 'table_single_items', 'path': CHART_single_RE['file_name']},
                {'name': 'table_multi_items', 'path': CHART_multi_RE['file_name']},
                {'name': 'summary', 'path': result_summary['file_name']}
            ],
            'summary': summary_stats
        }
    }
