import logging
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

import os
from pathlib import Path

log_dir = Path(__file__).parent.parent / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / "toolbox.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(log_file, encoding="utf-8"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("datagent")


class Settings(BaseSettings):
    # 百炼模型
    dashscope_api_key: str = ""
    dashscope_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    model_name: str = "deepseek-v4-flash"

    # MCP Server
    mcp_server_url: str = "http://127.0.0.1:8770/api/agent/mcp"
    mcp_timeout: int = 180
    mcp_max_retries: int = 3

    # 文件解析
    vision_api_key: Optional[str] = None
    max_file_size_mb: int = 50

    # OSS
    oss_access_key_id: Optional[str] = ""
    oss_access_key_secret: Optional[str] = ""
    oss_region: str = ""
    oss_bucket: Optional[str] = "nemo-copilot"
    oss_endpoint: Optional[str] = ""
    oss_prefix: str = "nemo"
    oss_profile: str = "prod"

    # FastAPI
    host: str = "0.0.0.0"
    port: int = 8000

    # Chart Server
    chart_server: str = "http://192.168.68.100:9090"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
log.info("Loaded settings: %s", settings.dict())
