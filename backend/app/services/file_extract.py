"""Extract text content from various file types."""

import csv
import io
import json
from pathlib import Path


# Extension → content_type mapping
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".tiff", ".svg"}
VIDEO_EXTS = {".mp4", ".avi", ".mov", ".mkv", ".wmv", ".flv", ".webm", ".m4v"}
TEXT_EXTS = {".txt", ".md", ".csv", ".json", ".pdf", ".docx"}


def detect_content_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext in IMAGE_EXTS:
        return "image"
    if ext in VIDEO_EXTS:
        return "video"
    if ext in TEXT_EXTS:
        return "text"
    return "unknown"


def extract_text(filepath: str, original_filename: str) -> str:
    ext = Path(original_filename).suffix.lower()
    p = Path(filepath)

    if ext in (".txt", ".md"):
        return p.read_text(encoding="utf-8", errors="replace")

    if ext == ".csv":
        raw = p.read_text(encoding="utf-8", errors="replace")
        reader = csv.reader(io.StringIO(raw))
        rows = list(reader)
        return "\n".join([", ".join(row) for row in rows[:200]])

    if ext == ".json":
        raw = p.read_text(encoding="utf-8", errors="replace")
        try:
            obj = json.loads(raw)
            return json.dumps(obj, ensure_ascii=False, indent=2)[:10000]
        except json.JSONDecodeError:
            return raw[:10000]

    if ext == ".pdf":
        return _extract_pdf(p)

    if ext == ".docx":
        return _extract_docx(p)

    return p.read_text(encoding="utf-8", errors="replace")[:5000]


def _extract_pdf(p: Path) -> str:
    try:
        import PyPDF2
        text_parts = []
        with open(p, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages[:50]:
                text_parts.append(page.extract_text() or "")
        return "\n".join(text_parts)[:10000]
    except ImportError:
        return "[PDF 解析需要安装 PyPDF2: pip install PyPDF2]"
    except Exception as e:
        return f"[PDF 解析失败: {e}]"


def _extract_docx(p: Path) -> str:
    try:
        import docx
        doc = docx.Document(str(p))
        text_parts = [para.text for para in doc.paragraphs[:200]]
        return "\n".join(text_parts)[:10000]
    except ImportError:
        return "[DOCX 解析需要安装 python-docx: pip install python-docx]"
    except Exception as e:
        return f"[DOCX 解析失败: {e}]"
