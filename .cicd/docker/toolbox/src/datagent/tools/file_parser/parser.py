import mimetypes
import os
import shutil
import urllib.request
import alibabacloud_oss_v2 as oss
from pathlib import Path
from typing import Literal, Optional
from .image import parse_image
from .docx import parse_docx
from .pdf import parse_pdf
from .excel import parse_excel
from config import settings

FileType = Literal["image", "docx", "pdf", "excel"]


def infer_type(file_path: str) -> FileType:
    """Infer file type from path or MIME."""
    mime, _ = mimetypes.guess_type(file_path)
    if mime:
        if mime.startswith("image/"):
            return "image"
        if mime in ("application/pdf",):
            return "pdf"
        if mime in ("application/vnd.openxmlformats-officedocument.wordprocessingml.document",):
            return "docx"
        if mime in (
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
        ):
            return "excel"
    ext = Path(file_path).suffix.lower()
    if ext in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"):
        return "image"
    if ext == ".pdf":
        return "pdf"
    if ext == ".docx":
        return "docx"
    if ext in (".xlsx", ".xls"):
        return "excel"
    raise ValueError(f"Unsupported file type: {file_path}")


def _download_from_oss(oss_path: str) -> bytes:
    """Download file from OSS, return bytes."""
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
    result = client.get_object(oss.GetObjectRequest(
        bucket=settings.oss_bucket,
        key=key,
    ))
    with result.body as body_stream:
        return body_stream.read()


def _download_to_temp(oss_path: str) -> str:
    """Download OSS file to temp file under /tmp/{uuid}, return local path."""
    import uuid
    temp_dir = f"/tmp/{uuid.uuid4().hex}"
    os.makedirs(temp_dir, exist_ok=True)
    suffix = Path(oss_path).suffix or ".tmp"
    path = os.path.join(temp_dir, f"file{suffix}")
    try:
        file_data = _download_from_oss(oss_path)
        with open(path, "wb") as f:
            f.write(file_data)
    except Exception:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise
    return path


async def parse_file(oss_path: Optional[str] = None) -> dict:
    """
    Parse file by MIME type, return structured result.

    Args:
        oss_path: OSS path for remote file
        auth_token: Optional auth token (reserved for future use)

    Returns:
        {"format": "markdown" | "jsonlines", "content": str, "summary": dict}
    """
    # Download remote file if needed
    local_path = _download_to_temp(oss_path)
    temp_path = local_path

    file_type = infer_type(local_path)
    try:
        if file_type == "image":
            return await parse_image(local_path, oss_path)
        elif file_type == "docx":
            return parse_docx(local_path)
        elif file_type == "pdf":
            return parse_pdf(local_path)
        elif file_type == "excel":
            return parse_excel(local_path)
        else:
            raise ValueError(f"Unknown file type: {file_type}")
    finally:
        # Clean up temp file
        if temp_path:
            import os
            try:
                os.unlink(temp_path)
            except Exception:
                pass
