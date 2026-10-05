"""Resume text extraction.

Supports PDF (.pdf via pypdf), Word (.docx via python-docx) and plain
text (.txt). Returns clean, normalized text ready for feature extraction.
"""
import io
import os
import re


def clean_text(text: str) -> str:
    """Collapse whitespace, drop control chars, strip."""
    text = re.sub(r"[\x00-\x08\x0b-\x1f\x7f]", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n", text)
    return text.strip()


def _from_pdf(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _from_docx(data: bytes) -> str:
    import docx

    doc = docx.Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs)


def extract_text(data: bytes, filename: str) -> str:
    """Extract + clean resume text. Raises ValueError on unsupported type."""
    ext = os.path.splitext(filename)[1].lower()
    try:
        if ext == ".pdf":
            raw = _from_pdf(data)
        elif ext == ".docx":
            raw = _from_docx(data)
        elif ext == ".txt":
            raw = data.decode("utf-8", errors="replace")
        else:
            raise ValueError(
                f"Unsupported resume format '{ext}'. Use .pdf, .docx or .txt"
            )
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Could not parse the resume file ({e})")
    text = clean_text(raw)
    if len(text) < 20:
        raise ValueError("Could not extract readable text from the resume file")
    return text
