import httpx
import base64
from typing import Optional
from config import settings


async def parse_image(file_path: Optional[str] = None, oss_path: Optional[str] = None) -> dict:
    """
    Parse image via vision API, return markdown description.
    Falls back to filename if no vision API configured.
    """
    content = ""
    image_data = None

    if file_path:
        with open(file_path, "rb") as f:
            image_data = f.read()

    if image_data:
        if settings.vision_api_key:
            content = await _call_vision_api(image_data)
        else:
            content = f"![image]({oss_path or file_path})"
    else:
        content = f"![image]({oss_path or file_path})"

    return {
        "format": "markdown",
        "content": content,
        "summary": {"type": "image", "has_vision_result": bool(settings.vision_api_key)},
    }


async def _call_vision_api(image_data: bytes) -> str:
    """Call vision API for image description."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://dashscope.aliyuncs.com/api/v1/services/vision/ocr/general",
            headers={"Authorization": f"Bearer {settings.vision_api_key}"},
            json={
                "model": "qwen-vl-plus",
                "input": {"image": base64.b64encode(image_data).decode()},
            },
        )
        response.raise_for_status()
        result = response.json()
        texts = []
        for item in result.get("output", {}).get("results", []):
            texts.append(item.get("text", ""))
        return "\n".join(texts)
