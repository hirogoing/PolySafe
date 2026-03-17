import asyncio
import json
from datetime import datetime

from app.database import SessionLocal
from app.models import Task
from app.services import doubao_service, rule_engine


TERMINAL_STATUS = {"pass", "block", "review", "error"}


def _now_str() -> str:
    return datetime.now().strftime("%H:%M:%S")


def append_log(db, task: Task, stage: str, message: str, payload=None):
    logs = []
    if task.process_logs:
        try:
            logs = json.loads(task.process_logs)
        except Exception:
            logs = []

    entry = {
        "time": _now_str(),
        "stage": stage,
        "message": message,
    }
    if payload is not None:
        entry["payload"] = payload

    logs.append(entry)
    task.process_logs = json.dumps(logs, ensure_ascii=False)
    task.updated_at = datetime.now()
    db.commit()


async def process_task(task_id: int):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return

        task.status = "processing"
        db.commit()
        append_log(db, task, "start", "任务进入处理队列")

        append_log(db, task, "model", f"正在调用{task.content_type}识别模型")
        if task.content_type == "image":
            ai_result = await doubao_service.analyze_image(task.content_url)
        elif task.content_type == "video":
            ai_result = await doubao_service.analyze_video(task.content_url)
        elif task.content_type == "text":
            ai_result = await doubao_service.analyze_text(task.content_text)
        else:
            raise ValueError(f"不支持的内容类型: {task.content_type}")

        task.ai_result = json.dumps(ai_result, ensure_ascii=False)
        task.confidence = ai_result.get("confidence", 0.0)
        task.violation_types = ",".join(ai_result.get("violation_types", []))
        task.risk_description = ai_result.get("risk_description", "")
        db.commit()
        append_log(db, task, "model", "模型识别完成", {
            "confidence": task.confidence,
            "violation_types": ai_result.get("violation_types", []),
            "violation_detected": ai_result.get("violation_detected", False),
        })

        append_log(db, task, "rule_match", "开始匹配策略规则")
        judgment = rule_engine.judge(ai_result, db)
        task.matched_rules = json.dumps(judgment["matched_rules"], ensure_ascii=False)
        db.commit()
        append_log(db, task, "rule_match", "规则匹配完成", {
            "matched_count": len(judgment["matched_rules"]),
            "matched_rules": judgment["matched_rules"],
        })

        task.status = judgment["action"]
        task.updated_at = datetime.now()
        db.commit()
        append_log(db, task, "decision", "策略决策完成", {
            "final_action": judgment["action"],
            "reason": judgment["reason"],
        })

    except Exception as e:
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            task.status = "error"
            task.risk_description = str(e)
            task.updated_at = datetime.now()
            db.commit()
            append_log(db, task, "error", "任务处理失败", {"error": str(e)})
    finally:
        db.close()


def process_task_sync(task_id: int):
    asyncio.run(process_task(task_id))
