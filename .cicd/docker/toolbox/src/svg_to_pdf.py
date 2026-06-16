#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
SVG to PDF 转换模块
"""

import tempfile
import os

from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# =========================
# 配置
# =========================

FONT_NAME = "AlibabaPuHuiTi"
# FONT_PATH="/mnt/github/nemo-copilot/.cicd/playbook/roles/toolbox/build/fonts/AlibabaPuHuiTi-3-45-Light.ttf"
FONT_PATH = "/usr/share/fonts/alibaba/AlibabaPuHuiTi-3-45-Light.ttf"

# 注册中文字体
pdfmetrics.registerFont(TTFont(FONT_NAME, FONT_PATH))


# =========================
# 核心转换逻辑
# =========================

def replace_font(node):
    """遍历 drawing 节点树并替换字体"""
    if hasattr(node, "fontName"):
        node.fontName = FONT_NAME

    if hasattr(node, "contents"):
        for child in node.contents:
            replace_font(child)

    for attr in dir(node):
        try:
            value = getattr(node, attr)
        except Exception:
            continue

        if isinstance(value, list):
            for item in value:
                if hasattr(item, "fontName") or hasattr(item, "contents"):
                    replace_font(item)


def convert_svg_to_pdf(svg_content: bytes) -> bytes:
    """将 SVG 内容转换为 PDF 字节流"""
    with tempfile.NamedTemporaryFile(suffix=".svg", delete=False) as svg_file:
        svg_file.write(svg_content)
        svg_path = svg_file.name

    try:
        drawing = svg2rlg(svg_path)
        if drawing is None:
            raise ValueError("SVG 解析失败")

        replace_font(drawing)

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as pdf_file:
            pdf_path = pdf_file.name

        renderPDF.drawToFile(drawing, pdf_path)

        with open(pdf_path, "rb") as f:
            pdf_content = f.read()

        os.unlink(pdf_path)
        return pdf_content

    finally:
        os.unlink(svg_path)
