# Land 项目


## 🚀 启动方式

在根目录下创建.env文件，文件.env的配置内容如下（要求REGION和ENDPOINT对应，否则会默认走REGION公网）：    
```
ACCESSKEY_ID=
ACCESSKEY_SECRET=
REGION=cn-beijing
BUCKET_RAW=用户上传数据的Bucket
BUCKET_RESULT=计算任务结果的Bucket
APP_ENV=test|prod|dev等
ENDPOINT=oss-cn-beijing-internal.aliyuncs.com
BAILIAN_KEY=百炼的APIKEY
```


### 方式一：本地运行（pip）

1. 创建并激活 Python 虚拟环境（可选）：

```bash
python -m venv venv
source venv/bin/activate
```

2. 安装依赖：

```bash
pip install -r requirements.txt
```

3. 启动服务：
开发环境    
```bash 
uvicorn main:app --reload --env-file .env
```
正式环境    
```bash
uvicorn main:app --env-file .env
```

4. 打开文档：

- 文档地址：`http://127.0.0.1:8000/docs`

### 方式二：Docker

1. 构建镜像：

```bash
docker build -t land-service .
```

2. 本地运行容器：

```bash
docker run -p 8000:8000 --env-file .env land-service     
```    
3.容器部署成后台任务：
```bash
docker run -d --name land-service -p 8000:8000 --env-file .env land-service
```  

4.停止服务
```bash
docker stop land-service
```

5. 打开文档：     

- 文档地址：`http://127.0.0.1:8000/docs`


## 📌 API 说明

### 1. /segmentation
- 说明：分词及词频统计
- 方法：POST
- 参数：
  - `user_data_oss_path`（Excel 文件名）
  - `user_selected_stopword_names`（停用词库名称，多个用 `@` 分隔）
  - `user_stopwords_path`（可选，自定义停用词文件名）
  - `seg_model`（`Jieba` 或 `SnowNLP`）

### 2. /co_occurrence
- 说明：构建词共现网络
- 方法：POST
- 参数：
  - `user_data_oss_path`（Excel 文件名）
  - `min_frequency`（最小共现频次，默认 1）
  - `top_n`（返回前 N 个高频词对，默认 500，最大 1000）

### 3. /sentiment
- 说明：情感打分
- 方法：POST
- 参数：
  - `user_data_oss_path`（Excel 文件名）
  - `neg_threshold`（负向/中性分界，默认 0.4）
  - `neu_threshold`（中性/积极分界，默认 0.6）
  - `pos_threshold`（积极上限，默认 1.0）

### 4. /topic_occurrence
- 说明：主题共现   
- 方法：POST   
- 参数：     
  - `user_data_oss_path`（Excel 文件名）
  - `delimiter`（text列中主题分类的分割符， 默认 @ 分割）    

### 5. /interpret_data
- 说明：LLM对数据解读 
- 方法：POST   
- 参数：     
  - `user_data_oss_path`（Excel 文件名）
  - `purpose`（数据的标题、概述等）    
