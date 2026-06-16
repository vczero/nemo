from fastapi import FastAPI, Query, Body, Request
from fastapi.responses import StreamingResponse, HTMLResponse
from core_compute.seg import perform_segmentation
from core_compute.tf_idf import compute_tf_idf
from core_compute.doc_sim import compute_document_similarity
from core_compute.frequent_itemset import compute_frequent_itemset
from core_compute.frequent_itemset_split import compute_frequent_itemset_split
from core_compute.co_occurrence import build_co_occurrence_network
from core_compute.sentiment import compute_sentiment_scores
from core_compute.topic_occurrence import build_topic_co_occurrence_network
from core_compute.llm_interpret_data import interpret_data_stream_generator
from core_compute.llm_translate import translate_text_stream_generator
from datetime import datetime
from fastapi.responses import StreamingResponse
from typing import Optional
from pydantic import BaseModel, Field



app = FastAPI()
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{start_time}] Incoming request: {request.method} {request.url.path}")

    response = await call_next(request)

    end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{end_time}] Completed response: {request.method} {request.url.path} - Status: {response.status_code}")

    return response

@app.get('/', summary='Hello Start')
def hello_start():
    return {"message": "Hello, 请使用Java开启异步任务调用以下Python服务。"}


@app.post("/segmentation", summary='分词与统计', response_description='返回分词结果和词频统计结果')
def segmentation_request(
    user_data_oss_path: str = Body(..., description='用户上传到OSS后的Exce文件名称，只是文件名称', examples=['segmentation.xlsx']),
    user_selected_stopword_names: str = Body(..., 
        description='选用的停用词库（多选），多个名称用@分割：百度停用词表、哈工大停用词表、四川大学停用词表', examples=['哈工大停用词表']),
    user_stopwords_path: str = Body(None, description='用户上传到OSS后的停用词文件名称，只是文件名称', examples=['']),
    seg_model: str = Body(..., description='选用的分词模型（单选）：Jieba, SnowNLP', examples=['Jieba'])
):


    return perform_segmentation(user_data_oss_path, user_selected_stopword_names, user_stopwords_path, seg_model)


@app.post('/co_occurrence', summary='语义共现网络', response_description='返回共现词对及其频次，按照频次从高到低排序')
def co_occurrence_request(
    user_data_oss_path: str = Body(..., description='用户上传到OSS后的Excel文件名称，只是文件名称', examples=['co_occurrence.xlsx']),
    min_frequency: int = Body(1, description='最小共现频次过滤', examples=[1]),
    top_n: int = Body(500, description='返回前N个高频共现词对（默认500，最大1000）', examples=[500])
):
    return build_co_occurrence_network(user_data_oss_path, min_frequency=min_frequency, top_n=top_n)


@app.post('/sentiment', summary='情感计算', response_description='返回情感打分结果')
def sentiment_request(
    user_data_oss_path: str = Body(..., description='用户上传到OSS后的Excel文件名称，只是文件名称', examples=['sentiment.xlsx']),
    neg_threshold: float = Body(0.4, description='消极分界线，默认0-0.4', examples=[0.4]),
    neu_threshold: float = Body(0.6, description='中性分界线，默认0.4-0.6', examples=[0.6]),
    pos_threshold: float = Body(1.0, description='积极上限，默认0.6-1.0', examples=[1.0])
):
    return compute_sentiment_scores(user_data_oss_path, neg_threshold=neg_threshold, neu_threshold=neu_threshold, pos_threshold=pos_threshold)

@app.post('/topic_occurrence', summary='话题共现网络', 
response_description='返回话题频次统计结果和共现矩阵结果，话题分隔符默认为@，例如文本字段为“我喜欢这个话题A@话题B”，则会被分割成话题A和话题B进行共现分析')
def topic_occurrence_request(
    user_data_oss_path: str = Body(..., description='用户上传到OSS后的Excel文件名称，只是文件名称', examples=['topic_occurrence.xlsx']),
    delimiter: str = Body('@', description='text字段中的新闻主题（话题）分隔符，默认@', examples=['@'])
):
    return build_topic_co_occurrence_network(user_data_oss_path, delimiter=delimiter)



# 数据解读API
class InterpretDataInput(BaseModel):
    # 配置
    user_prompt: str = Field(
        default='',
        description='用户提示词模板，可使用 {purpose} 占位'
    )
    system_prompt: str = Field(
        default='你是一名专业的数据分析师，擅长数据解读任务。',
        description='系统角色设定(system prompt)'
    )

    # 业务
    user_data_oss_path: str = Field(
        ...,
        description='用户上传到OSS后的Excel文件名称',
        examples=['interpret_data.xlsx']
    )
    purpose: str = Field(
        default='',
        description='图表标题，用于LLM解读时提供上下文'
    )

class InterpretDataRequest(BaseModel):
    model: str = Field(
        default='qwen-plus',
        description='调用的模型名称，默认为 qwen-plus',
        examples=['qwen-plus']
    )
    input: InterpretDataInput

@app.post(
    '/interpret_data',
    summary='LLM数据解读能力',
    response_description='流式返回LLM解读结果的文本'
)
@app.post(
    '/interpret_data',
    summary='LLM数据解读能力',
    response_description='流式返回LLM解读结果的文本'
)
def interpret_data_request(request: InterpretDataRequest = Body(...)):
    return StreamingResponse(
        interpret_data_stream_generator(
            user_data_oss_path=request.input.user_data_oss_path,
            model=request.model,
            purpose=request.input.purpose,
            role=request.input.system_prompt,
            prompt_template=request.input.user_prompt if request.input.user_prompt else None
        ),
        media_type='text/event-stream'
    )


# 翻译API
class TranslateTextInput(BaseModel):
    # 配置
    user_prompt: str = Field(
        default='',
        description='用户提示词模板'
    )
    system_prompt: str = Field(
        default='你是一名专业的英文学术论文作者，擅长将中文内容翻译成符合SSCI论文风格的英文表达，需要简约。',
        description='系统角色设定(system prompt)'
    )

    # 业务
    user_data_text: str = Field(
        ...,
        description='用户直接输入的文本',
        examples=['这是一个需要翻译的文本。']
    )

class TranslateTextRequest(BaseModel):
    model: str = Field(
        default='qwen-plus',
        description='调用的模型名称，默认为 qwen-plus',
        examples=['qwen-plus']
    )
    input: TranslateTextInput


@app.post(
    '/translate_text',
    summary='LLM翻译能力',
    response_description='流式返回LLM翻译结果的文本'
)

@app.post(
    '/translate_text',
    summary='LLM翻译能力',
    response_description='流式返回LLM翻译结果的文本'
)
def translate_text_request(request: TranslateTextRequest = Body(...)):
    return StreamingResponse(
        translate_text_stream_generator(
            text_data=request.input.user_data_text,
            model=request.model,
            role=request.input.system_prompt,
            prompt_template=request.input.user_prompt if request.input.user_prompt else None
        ),
        media_type='text/event-stream'
    )


@app.post('/tf_idf', summary='TF-IDF计算', response_description='返回TF-IDF计算结果')
def tf_idf_request(
    # segmentation.xlsx
    user_data_oss_path: str = Body(..., description='用户上传到OSS后的Excel文件名称，只是文件名称', examples=['TFIDF.xlsx']),
    user_selected_stopword_names: str = Body(..., 
        description='选用的停用词库（多选），多个名称用@分割：百度停用词表、哈工大停用词表、四川大学停用词表', examples=['哈工大停用词表']),
    user_stopwords_path: str = Body(None, description='用户上传到OSS后的停用词文件名称，只是文件名称', examples=['']),
    top_n: int = Body(10, description='每个文档返回的最多关键词数量', examples=[10])
):
    return compute_tf_idf(user_data_oss_path, user_selected_stopword_names, user_stopwords_path, top_n=top_n)



@app.post('/doc_sim', summary='文档相似度计算', response_description='返回文档间的相似度矩阵和统计结果')
def doc_sim_request(
    user_data_oss_path: str = Body(..., description='用户上传到OSS后的Excel文件名称，只是文件名称', examples=['similarity.xlsx']),
    user_selected_stopword_names: str = Body(..., 
        description='选用的停用词库（多选），多个名称用@分割：百度停用词表、哈工大停用词表、四川大学停用词表', examples=['哈工大停用词表']),
    user_stopwords_path: str = Body(None, description='用户上传到OSS后的停用词文件名称，只是文件名称', examples=[''])
):
    return compute_document_similarity(user_data_oss_path, user_selected_stopword_names, user_stopwords_path)


@app.post('/frequent_itemset', summary='频繁项集挖掘', response_description='返回频繁项集挖掘结果')
def frequent_itemset_request(
    user_data_oss_path: str = Body(..., description='用户上传到OSS后的Excel文件名称，只是文件名称', examples=['frequent_itemset.xlsx']),
    user_selected_stopword_names: str = Body(..., 
        description='选用的停用词库（多选），多个名称用@分割：百度停用词表、哈工大停用词表、四川大学停用词表', examples=['哈工大停用词表']),
    user_stopwords_path: str = Body(None, description='用户上传到OSS后的停用词文件名称，只是文件名称', examples=['']),
    min_support: float = Body(0.1, description='最小支持度阈值，范围0-1', examples=[0.1])
):
    return compute_frequent_itemset(user_data_oss_path, user_selected_stopword_names, user_stopwords_path, min_support=min_support)


@app.post('/frequent_itemset_split', summary='频繁项集挖掘(分隔符模式)', response_description='使用分隔符分割项目，不使用分词能力')
def frequent_itemset_split_request(
    user_data_oss_path: str = Body(..., description='用户上传到OSS后的Excel文件名称，只是文件名称', examples=['frequent_itemset_split.xlsx']),
    min_support: float = Body(0.1, description='最小支持度阈值，范围0-1', examples=[0.1]),
    delimiter: str = Body('@', description='项目分隔符，默认@', examples=['@'])
):
    return compute_frequent_itemset_split(user_data_oss_path, min_support=min_support, delimiter=delimiter)


