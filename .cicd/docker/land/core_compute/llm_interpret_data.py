from utils.utils import download_excel_data, upload_excel_data, GLOBAL_CONFIG
import pandas as pd
import os 
from openai import OpenAI
import json
from collections.abc import Mapping, Sequence

API_KEY = os.getenv("BAILIAN_KEY")
try:
    client = OpenAI(api_key=API_KEY, base_url="https://dashscope.aliyuncs.com/compatible-mode/v1")
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")


# 管理系统角色和用户输入的提示词构建
def construct_llm_prompt(data_text: str, purpose=None, role=None, prompt_template=None) -> str:
    """构造提示词，包含系统角色设定和用户输入的提示词。
    - data_text: 从Excel中提取的数据文本，通常是CSV格式的字符串
    - purpose: 可选，用户的目的，例如“2016年GDP”
    - role: 可选，模型的角色设定，默认“你是一名专业的数据分析师，擅长数据解读任务。”
    - prompt_template: 可选，用户自定义的提示词模板，例如“请以{purpose}为主题，对以下数据进行分析和解读，要求输出适合放在论文Results部分的内容。”
    """
    role = role or '你是一名专业的数据分析师，擅长数据解读任务。'
    if prompt_template: 
        prompt = prompt_template.replace("{purpose}", purpose or "")
        prompt += '\n数据内容如下：\n' + data_text
        return [
            {'role': 'system', 'content': role},
            {'role': 'user', 'content': prompt}
        ]   
    else:
        prompt = ''
        if purpose:
            prompt += f'{purpose}。'
        else:
            prompt += '将以下数据进行解读和分析并输出结果，可以直接放到论文Results部分。要求如下：\n'
        prompt += '1. 对数据进行概括，提炼出主要信息和趋势。\n'
        prompt += '2. 识别数据中的关键指标，并解释其可能的原因。\n'
        prompt += '3. 提供数据背后的洞察和建议，帮助用户更好地理解数据的意义和潜在的行动方向。\n'  
        prompt += '4. 如果存在异常值，请指出并分析其可能的原因。\n'
        prompt += '5. 请确保你的解读清晰、简洁，并且易于理解；结果要客观。\n'
        prompt += '6. 只输出解读结果的文本，不要输出任何其他内容。不要输出Markdown格式的内容, 必须是Plain Text格式。\n'
        prompt += '7. 以论文写作为目的，“以如图所示”开头，使用“第一、第二...” 或者“首先、其次...”等连接词。不要在回答中给出后续研究建议。\n'
        prompt += '8. 字数一定不要超过1000个字！！！\n'
        prompt += '数据内容如下：\n'
        prompt += data_text
        return [
            {'role': 'system', 'content': role},
            {'role': 'user', 'content': prompt}
        ]
         


# model list: https://help.aliyun.com/zh/model-studio/getting-started/models
# responses模式
def call_api_stream(model, messages=None):
    stream = client.responses.create(
        model=model,
        input=messages,
        temperature=0.1,
        stream=True,
    )
    return stream
       
def interpret_data_stream_generator(model="qwen-plus", user_data_oss_path=None, purpose=None, role=None, prompt_template=None):
    if not API_KEY:
        yield "event: response.error\n"
        yield f'data: {{"message":"API key not found. Please set the BAILIAN_KEY environment variable."}}\n\n'
        return

    if client is None:
        yield "event: response.error\n"
        yield f'data: {{"message":"OpenAI client 初始化失败"}}\n\n'
        return

    try:
        excel_data = download_excel_data(user_data_oss_path)
        if len(excel_data) == 0:
            yield "event: response.error\n"
            yield f'data: {{"message":"Excel中的数据不能为空"}}\n\n'
            return
    except Exception as e:
        yield "event: response.error\n"
        yield f'data: {{"message":"下载或读取Excel数据失败: {str(e)}"}}\n\n'
        return

    try:
        data_text = excel_data.to_csv(index=False)
        prompt_messages = construct_llm_prompt(data_text, purpose=purpose, role=role, prompt_template=prompt_template)

        for event in call_api_stream(model=model, messages=prompt_messages):
            yield f"event: {event.type}\n"
            yield f"data: {event.model_dump_json()}\n\n"

    except Exception as e:
        yield "event: response.error\n"
        yield f'data: {{"message":"调用模型失败: {str(e)}"}}\n\n'
