from docx import Document


def parse_docx(file_path: str) -> dict:
    """Parse docx file, return markdown."""
    doc = Document(file_path)
    paragraphs = []
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            if para.style.name.startswith("Heading"):
                level = para.style.name[-1]
                paragraphs.append(f"{'#' * int(level)} {text}")
            else:
                paragraphs.append(text)
    return {
        "format": "markdown",
        "content": "\n\n".join(paragraphs),
        "summary": {"type": "docx", "paragraph_count": len(paragraphs)},
    }
