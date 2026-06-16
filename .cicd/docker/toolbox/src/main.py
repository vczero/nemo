#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Toolbox - 工具箱服务入口

sample:
curl -X POST "http://192.168.68.100:8800/svg-to-pdf" \
-F "file=@/mnt/github/nemo-copilot/backend/nemo-copilot-web/src/test/resources/com/ywllab/nemo/util/sankey.svg" \
-o sankey.pdf
"""
import uvicorn
import tempfile
import sys
from pathlib import Path

# Ensure datagent package is importable from src/ (when running via uvicorn from src/)
_project_root = Path(__file__).parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from svg_to_pdf import convert_svg_to_pdf
from datagent.api.model import ResponseRequest
from datagent.agent.agent import data_agent
from config import settings, log

app = FastAPI(
    title="Toolbox",
    description="工具箱服务 - 提供文件转换、数据分析等工具",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# Toolbox routes
# ========================

@app.get("/health")
async def health():
    """健康检查"""
    return {"status": "ok", "service": "toolbox"}


@app.post("/svg-to-pdf")
async def svg_to_pdf(file: UploadFile = File(...)):
    """SVG 转 PDF"""
    if not file.filename.lower().endswith(".svg"):
        raise HTTPException(status_code=400, detail="请上传 SVG 文件")

    try:
        svg_content = await file.read()
        pdf_content = convert_svg_to_pdf(svg_content)

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as pdf_file:
            pdf_file.write(pdf_content)
            pdf_path = pdf_file.name

        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename=file.filename.replace(".svg", ".pdf")
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"转换失败: {str(e)}")


# DataAgent /v1/responses endpoint (from original datagent main.py)
@app.post("/v1/responses")
async def create_response(raw_request: Request, request: ResponseRequest)->StreamingResponse:
    """
    OpenAI Response API compatible endpoint.
    Accepts file + text, streams agent response as SSE.
    """
    try:
        auth_token = raw_request.headers.get("Authorization")
        return  await data_agent(auth_token, request)
    except Exception as e:
        import traceback
        log.error("Error in /v1/responses: %s\n%s", e, traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
