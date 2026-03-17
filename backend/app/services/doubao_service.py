import base64
import json
import mimetypes
from pathlib import Path

import httpx

from app.config import settings

AUDIT_PROMPT = """你是一个专业的内容审核AI助手。请分析以下内容，判断是否存在违规信息。

请按以下JSON格式返回分析结果（只返回JSON，不要其他内容）：
{
    "violation_detected": true/false,
    "violation_types": ["违规类型1", "违规类型2"],
    "confidence": 0.0-1.0,
    "risk_description": "风险描述"
}

违规类型包括：色情、暴力、仇恨言论、垃圾广告、违法违规、其他
confidence 为你对判断的置信度，0表示完全无风险，1表示确定违规。
如果内容正常无风险，violation_types为空数组，confidence接近0。"""


def _to_model_media_ref(media_url: str, default_mime: str) -> str:
    if not media_url:
        return media_url

    if media_url.startswith(("http://", "https://", "data:")):
        return media_url

    local_path = None
    if media_url.startswith("/uploads/"):
        local_path = Path(settings.upload_dir) / media_url.removeprefix("/uploads/")
    else:
        candidate = Path(media_url)
        if candidate.exists():
            local_path = candidate

    if local_path and local_path.exists():
        mime = mimetypes.guess_type(local_path.name)[0] or default_mime
        encoded = base64.b64encode(local_path.read_bytes()).decode("utf-8")
        return f"data:{mime};base64,{encoded}"

    return media_url


async def analyze_image(image_url: str) -> dict:
    image_ref = _to_model_media_ref(image_url, "image/jpeg")
    content = [
        {"type": "input_image", "image_url": image_ref},
        {"type": "input_text", "text": AUDIT_PROMPT},
    ]
    return await _call_model(content, timeout=30)


async def analyze_video(video_url: str) -> dict:
    video_ref = _to_model_media_ref(video_url, "video/mp4")
    content = [
        {"type": "input_video", "video_url": video_ref},
        {"type": "input_text", "text": AUDIT_PROMPT},
    ]
    return await _call_model(content, timeout=120)


async def analyze_text(text: str) -> dict:
    content = [
        {"type": "input_text", "text": f"{AUDIT_PROMPT}\n\n待审核文本：\n{text}"},
    ]
    return await _call_model(content, timeout=30)


async def _call_model(content: list, timeout: int = 30) -> dict:
    url = f"{settings.ark_base_url}/responses"
    headers = {
        "Authorization": f"Bearer {settings.ark_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.ark_model_id,
        "input": [{"role": "user", "content": content}],
    }

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(url, headers=headers, json=payload)
        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            detail = response.text[:500] if response.text else str(e)
            raise RuntimeError(f"模型调用失败: {detail}") from e
        data = response.json()

    raw_text = _extract_text(data)
    return _parse_result(raw_text)


def _extract_text(data: dict) -> str:
    output = data.get("output", [])
    for item in output:
        if item.get("type") == "message":
            for content in item.get("content", []):
                if content.get("type") == "output_text":
                    return content.get("text", "")
    return ""


def _parse_result(text: str) -> dict:
    default = {
        "violation_detected": False,
        "violation_types": [],
        "confidence": 0.0,
        "risk_description": "解析失败",
    }
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1]) if len(lines) > 2 else text
    try:
        result = json.loads(text)
        return {
            "violation_detected": bool(result.get("violation_detected", False)),
            "violation_types": result.get("violation_types", []),
            "confidence": float(result.get("confidence", 0.0)),
            "risk_description": result.get("risk_description", ""),
        }
    except (json.JSONDecodeError, ValueError):
        return default
