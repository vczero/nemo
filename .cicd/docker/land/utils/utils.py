import alibabacloud_oss_v2 as oss
from alibabacloud_credentials.client import Client
from alibabacloud_credentials.models import Config
import pandas as pd
from pathlib import Path
import io
import os
import uuid

access_key_id = os.getenv("ACCESSKEY_ID")
access_key_secret = os.getenv("ACCESSKEY_SECRET")
region = os.getenv("REGION")
bucket_download = os.getenv("BUCKET_RAW")
bucket_upload = os.getenv("BUCKET_RESULT")
app_env = os.getenv("APP_ENV", "dev")  # 默认为开发环境
endpoint = os.getenv("ENDPOINT")

def download_excel_data(file_name='test.xlsx'):
    AKId = access_key_id
    AKSecrect = access_key_secret
    credentials_provider = oss.credentials.StaticCredentialsProvider(AKId, AKSecrect)
    cfg = oss.config.load_default()
    cfg.credentials_provider = credentials_provider
    
    cfg.region = region
    cfg.endpoint = endpoint
    client = oss.Client(cfg)
    result = client.get_object(oss.GetObjectRequest(
        bucket=bucket_download,
        key=file_name,  
    ))

    with result.body as body_stream:
        file_data = body_stream.read()
        excel_buffer = io.BytesIO(file_data)
        ext = os.path.splitext(file_name)[1].lower()
        if ext == '.xlsx':
            df = pd.read_excel(excel_buffer, engine='openpyxl')
        else:
            df = pd.read_excel(excel_buffer, engine='xlrd')
        return df


def upload_excel_data(df, file_name_prefix='computed_result'):
    try:
        AKId = access_key_id
        AKSecrect = access_key_secret
        credentials_provider = oss.credentials.StaticCredentialsProvider(AKId, AKSecrect)
        cfg = oss.config.load_default()
        cfg.credentials_provider = credentials_provider
        
        cfg.region = region
        cfg.endpoint = endpoint
        client = oss.Client(cfg)

        excel_buffer = io.BytesIO()
        df.to_excel(excel_buffer, index=False, engine='openpyxl')
        excel_buffer.seek(0)

        time_date = pd.Timestamp.now().strftime('%Y%m%d')
        file_name = f"land/{app_env}/{file_name_prefix}/{time_date}/{uuid.uuid4().hex}.xlsx"
        result = client.put_object(oss.PutObjectRequest(
            bucket=bucket_upload,
            key=file_name,
            body=excel_buffer.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ))

        return {
            'message': 'OK',
            'file_name': file_name
        }
    except Exception as e:
        return {
            'message': f'上传Excel文件失败: {e}'
        }


GLOBAL_CONFIG = {
    'USER_RAW_DATA_LIMIT': 50000,  # 用户上传的原始数据行数限制
}

def download_html(file_name='test.html'):
    AKId = access_key_id
    AKSecrect = access_key_secret
    credentials_provider = oss.credentials.StaticCredentialsProvider(AKId, AKSecrect)
    cfg = oss.config.load_default()
    cfg.credentials_provider = credentials_provider
    
    cfg.region = region
    cfg.endpoint = endpoint
    client = oss.Client(cfg)
    result = client.get_object(oss.GetObjectRequest(
        bucket=bucket_download,
        key=file_name,  
    ))

    with result.body as body_stream:
        file_data = body_stream.read()
        html_content = file_data.decode('utf-8')
        return html_content