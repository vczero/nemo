import os
from openai import OpenAI

API_KEY = os.getenv("BAILIAN_KEY")
client = None

try:
    client = OpenAI(
        api_key=API_KEY,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
    )
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")


def construct_translation_prompt(
    text_data: str,
    role: str = None,
    prompt_template: str = None
):
    """
    构造翻译提示词。
    - text_data: 用户输入的原始文本
    - role: 可选，模型角色设定
    - prompt_template: 可选，用户自定义提示词模板，模板中可使用 {text} 占位
    """
    role = role or (
        "你是一名专业的学术英文编辑，擅长将中文文本翻译为简洁、正式、"
        "符合SSCI论文写作规范的英文，需要简约。"
    )

    if prompt_template:
        user_prompt = prompt_template + '\n原文如下：\n' + text_data
    else:
        user_prompt = (
            "请将以下中文内容翻译成英文，并润色为符合SSCI/SCI论文风格的学术表达。"
            "要求如下：\n"
            "1. 语言正式、准确、简洁，符合学术论文写作规范。\n"
            "2. 优先采用SSCI/SCI常用表达方式，避免口语化表达。\n"
            "3. 保持原文含义准确，不随意增删信息。\n"
            "4. 若原文表达不够严谨，可在不改变原意的前提下适度优化。\n"
            "5. 只输出最终翻译后的英文结果，不要输出任何解释、注释、标题或Markdown格式。\n\n"
            f"原文如下：\n{text_data}"
        )

    return [
        {"role": "system", "content": role},
        {"role": "user", "content": user_prompt}
    ]


def call_api_stream(model, messages=None):
    stream = client.responses.create(
        model=model,
        input=messages,
        temperature=0.1,
        stream=True,
    )
    return stream


def translate_text_stream_generator(text_data, model="qwen-plus", role=None, prompt_template=None):
    """
    流式翻译接口生成器
    - text_data: 用户直接输入的文本
    - role: 可选角色设定
    - prompt_template: 可选用户自定义提示词模板
    """
    if not API_KEY:
        yield "event: response.error\n"
        yield 'data: {"message":"API key not found. Please set the BAILIAN_KEY environment variable."}\n\n'
        return

    if client is None:
        yield "event: response.error\n"
        yield 'data: {"message":"OpenAI client 初始化失败"}\n\n'
        return

    if not text_data or not str(text_data).strip():
        yield "event: response.error\n"
        yield 'data: {"message":"输入文本不能为空"}\n\n'
        return

    try:
        prompt_messages = construct_translation_prompt(
            text_data=text_data,
            role=role,
            prompt_template=prompt_template
        )

        for event in call_api_stream(model=model, messages=prompt_messages):
            yield f"event: {event.type}\n"
            yield f"data: {event.model_dump_json()}\n\n"

    except Exception as e:
        yield "event: response.error\n"
        yield f'data: {{"message":"调用模型失败: {str(e)}"}}\n\n'