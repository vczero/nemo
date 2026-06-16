import pdfplumber


def parse_pdf(file_path: str) -> dict:
    """Parse PDF file, return markdown."""
    texts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                texts.append(f"## Page {page.page_number}\n\n{page_text}")
    return {
        "format": "markdown",
        "content": "\n\n".join(texts),
        "summary": {"type": "pdf", "page_count": len(pdf.pages)},
    }
