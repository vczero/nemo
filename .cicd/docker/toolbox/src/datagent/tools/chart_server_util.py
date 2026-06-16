"""Chart server utilities for fetching chart types, guides, and rendering charts."""

import logging
import uuid

import alibabacloud_oss_v2 as oss
import httpx
from config import settings
from datagent.tools.cache_util import get_from_cache, set_cache

log = logging.getLogger("datagent.tools")


def _get_chart_server_url() -> str:
    """Get chart server URL, preferring test environment."""
    return settings.chart_server


def fetch_chart_types() -> str:
    """Fetch all supported chart types from chart server."""
    cached = get_from_cache("chart_types:all")
    if cached is not None:
        return cached

    url = f"{_get_chart_server_url()}/docs"
    try:
        response = httpx.get(url, timeout=3.0)
        response.raise_for_status()
        result = response.text
        set_cache("chart_types:all", result)
        return result
    except httpx.HTTPError as e:
        log.warning("Failed to fetch chart types from %s: %s", url, e)
        return f"无法从图表服务器获取图表类型列表，请检查服务器配置。当前服务器: {_get_chart_server_url()}"


def fetch_chart_guide(chart_type: str) -> str:
    """Fetch chart guide for a specific chart type."""
    cache_key = f"chart_guide:{chart_type}"
    cached = get_from_cache(cache_key)
    if cached is not None:
        return cached

    url = f"{_get_chart_server_url()}/docs/{chart_type}"
    try:
        response = httpx.get(url, timeout=3.0)
        response.raise_for_status()
        result = response.text
        set_cache(cache_key, result)
        return result
    except httpx.HTTPError as e:
        log.warning("Failed to fetch chart guide for %s from %s: %s", chart_type, url, e)
        return f"无法获取图表类型 {chart_type} 的配置指南，请检查服务器配置。当前服务器: {_get_chart_server_url()}"


def validate_chart_config(chart_config: str, chart_data: str) -> str:
    """
    Validate chart configuration by rendering it and upload thumbnail to OSS.

    Args:
        chart_config: Chart configuration JSON string
        chart_data: Chart data in DataTable format ({"columns": [...], "rows": [...]})

    Returns:
        JSON string with thumbnail OSS path if rendering succeeds, otherwise error message.
        Success format: {"ok": true, "thumbnail_oss_path": "chart/thumbnail/xxx.png"}
        Error format: {"ok": false, "error": "error message"}
    """
    import json

    url = f"{_get_chart_server_url()}/render"
    try:
        # 解析 chart_config
        chart_obj = json.loads(chart_config) if isinstance(chart_config, str) else chart_config
        chart_data_obj = json.loads(chart_data) if isinstance(chart_data, str) else chart_data

        # 如果 chart_data_obj 有 content 字段，提取其中的二维数组
        if isinstance(chart_data_obj, dict) and "content" in chart_data_obj:
            chart_data_obj = chart_data_obj["content"]

        # 构建最终参数：chartConfig 和 chartFile 是 chart 下的平级字段
        param = json.dumps({
            "chart": {
                "chartConfig": chart_obj,
                "chartFile": {"content": chart_data_obj}
            }
        })

        response = httpx.post(
            url,
            content=param,
            headers={"Content-Type": "application/json"},
            timeout=30.0,
        )
        if response.status_code == 200:
            result = response.json()
            data = result.get("data")
            log.info("Chart server response: ok=%s, data_type=%s, data_len=%s",
                     result.get("ok"), type(data).__name__, len(data) if data else 0)

            # 确保 data 是字符串或字节
            if data is None:
                return json.dumps({"ok": False, "error": "Chart server returned empty data"})
            if isinstance(data, (dict, list)):
                data = json.dumps(data)

            # 直接上传到 OSS
            oss_path = upload_thumbnail_to_oss(data)
            if oss_path is None:
                log.error("OSS upload failed for chart config")
                return json.dumps({
                    "ok": False,
                    "error": "Failed to upload thumbnail to OSS"
                })
            log.info("Chart thumbnail uploaded to: %s", oss_path)
            return json.dumps({
                "ok": True,
                "thumbnail_oss_path": oss_path
            })
        else:
            return json.dumps({
                "ok": False,
                "error": f"{response.status_code} - {response.text[:500]}"
            })
    except httpx.HTTPError as e:
        return json.dumps({
            "ok": False,
            "error": str(e)
        })
    except Exception as e:
        return json.dumps({
            "ok": False,
            "error": str(e)
        })


def upload_thumbnail_to_oss(thumbnail_data: str | bytes) -> str | None:
    """
    Upload thumbnail image to OSS and return the OSS path.

    Args:
        thumbnail_data: Base64 encoded thumbnail image data or raw bytes, may be a data URI like "data:image/svg+xml;base64,..."

    Returns:
        OSS path like "{prefix}/{profile}/CHART_THUMBNAIL/{userId}/{date}/{uuid}.png" or None if upload fails
    """
    import base64
    import io
    from datetime import datetime
    try:
        if not thumbnail_data:
            log.error("Thumbnail data is empty")
            return None

        log.info("Thumbnail data type: %s, prefix: %s", type(thumbnail_data).__name__,
                 str(thumbnail_data)[:60] if isinstance(thumbnail_data, str) else "bytes")

        # Generate OSS path matching Java format: {prefix}/{profile}/CHART_THUMBNAIL/{userId}/{date}/{uuid}.png
        # userId uses "system" as placeholder since it's not available in Python
        date_path = datetime.now().strftime("%Y/%m/%d")
        oss_path = f"{settings.oss_prefix}/{settings.oss_profile}/CHART_THUMBNAIL/system/{date_path}/{uuid.uuid4().hex[:16]}.svg"

        # Handle data URI format: "data:image/svg+xml;base64,..."
        if isinstance(thumbnail_data, str):
            if thumbnail_data.startswith("data:"):
                # Extract base64 part after the comma
                if "," in thumbnail_data:
                    thumbnail_data = thumbnail_data.split(",", 1)[1]
                    log.info("Extracted base64 from data URI")

            # Base64 encoded string - decode it
            try:
                image_data = base64.b64decode(thumbnail_data)
            except Exception as e:
                log.error("Failed to decode base64 thumbnail data: %s", e)
                return None
        else:
            # Raw bytes - use directly
            image_data = thumbnail_data

        log.info("Decoded image data length: %d bytes", len(image_data))

        # Upload to OSS using Client (same pattern as file_parser/parser.py)
        credentials_provider = oss.credentials.StaticCredentialsProvider(
            settings.oss_access_key_id,
            settings.oss_access_key_secret
        )
        cfg = oss.config.load_default()
        cfg.credentials_provider = credentials_provider
        cfg.region = settings.oss_region
        cfg.endpoint = settings.oss_endpoint

        client = oss.Client(cfg)
        key = oss_path.lstrip("/")

        log.info("Uploading to OSS: bucket=%s, endpoint=%s, key=%s, data_len=%d",
                 settings.oss_bucket, settings.oss_endpoint, key, len(image_data))

        # Use put_object with io.BytesIO body
        request = oss.PutObjectRequest(
            bucket=settings.oss_bucket,
            key=key,
            body=io.BytesIO(image_data),
        )
        client.put_object(request)

        log.info("Thumbnail uploaded to OSS: %s", oss_path)
        return oss_path
    except Exception as e:
        log.error("Failed to upload thumbnail to OSS: %s", e, exc_info=True)
        return None
