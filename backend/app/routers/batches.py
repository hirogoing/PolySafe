import os
import shutil
import json
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Batch, Task
from app.schemas import BatchOut
from app.services import task_service
from app.services.file_extract import detect_content_type, extract_text
from app.config import settings

router = APIRouter()


def _batch_to_out(batch: Batch) -> dict:
    tasks = batch.tasks or []
    status_counts = {}
    for t in tasks:
        status_counts[t.status] = status_counts.get(t.status, 0) + 1
    terminal = {"pass", "block", "review", "error"}
    done = sum(v for k, v in status_counts.items() if k in terminal)
    return {
        "id": batch.id,
        "name": batch.name,
        "total_count": batch.total_count,
        "created_at": batch.created_at,
        "updated_at": batch.updated_at,
        "tasks": tasks,
        "pass_count": status_counts.get("pass", 0),
        "block_count": status_counts.get("block", 0),
        "review_count": status_counts.get("review", 0),
        "error_count": status_counts.get("error", 0),
        "pending_count": status_counts.get("pending", 0) + status_counts.get("processing", 0),
        "done_count": done,
    }


@router.post("/", response_model=BatchOut)
async def create_batch(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    batch_name: str = Form(""),
    db: Session = Depends(get_db),
):
    if not files:
        raise HTTPException(status_code=400, detail="请至少上传一个文件")

    now = datetime.now()
    batch = Batch(
        name=batch_name or f"批量任务 {now.strftime('%Y-%m-%d %H:%M')}",
        total_count=len(files),
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    for upload_file in files:
        filename = upload_file.filename or "unknown"
        content_type = detect_content_type(filename)
        if content_type == "unknown":
            content_type = "text"

        ext = os.path.splitext(filename)[1] if filename else ""
        saved_name = f"{int(now.timestamp() * 1000)}_{filename}"
        filepath = os.path.join(settings.upload_dir, saved_name)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(upload_file.file, f)

        task = Task(
            batch_id=batch.id,
            original_filename=filename,
            content_type=content_type,
            status="pending",
            process_logs=json.dumps([{
                "time": now.strftime("%H:%M:%S"),
                "stage": "created",
                "message": f"批量任务已创建: {filename}",
            }], ensure_ascii=False),
        )

        if content_type == "image" or content_type == "video":
            task.content_url = f"/uploads/{saved_name}"
        elif content_type == "text":
            task.content_url = f"/uploads/{saved_name}"
            try:
                task.content_text = extract_text(filepath, filename)
            except Exception as e:
                task.content_text = f"[文件读取失败: {e}]"

        db.add(task)
        db.commit()
        db.refresh(task)

        background_tasks.add_task(task_service.process_task_sync, task.id)

    db.refresh(batch)
    return _batch_to_out(batch)


@router.get("/", response_model=list[BatchOut])
def list_batches(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    batches = (
        db.query(Batch)
        .order_by(Batch.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_batch_to_out(b) for b in batches]


@router.get("/{batch_id}", response_model=BatchOut)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return _batch_to_out(batch)
