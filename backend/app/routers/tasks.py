import os
import shutil
import json
from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Task
from app.schemas import TaskOut, TaskReview
from app.services import task_service
from app.config import settings

router = APIRouter()


@router.post("/", response_model=TaskOut)
async def create_task(
    background_tasks: BackgroundTasks,
    content_type: str = Form(...),
    content_text: str = Form(""),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    task = Task(
        content_type=content_type,
        content_text=content_text,
        status="pending",
        process_logs=json.dumps([
            {
                "time": datetime.now().strftime("%H:%M:%S"),
                "stage": "created",
                "message": "任务已创建，等待Agent处理",
            }
        ], ensure_ascii=False),
    )

    if file and content_type in ("image", "video"):
        ext = os.path.splitext(file.filename)[1] if file.filename else ""
        filename = f"{int(datetime.now().timestamp() * 1000)}{ext}"
        filepath = os.path.join(settings.upload_dir, filename)
        with open(filepath, "wb") as f:
            shutil.copyfileobj(file.file, f)
        task.content_url = f"/uploads/{filename}"

    db.add(task)
    db.commit()
    db.refresh(task)

    background_tasks.add_task(task_service.process_task_sync, task.id)
    return task


@router.get("/", response_model=list[TaskOut])
def list_tasks(
    status: str = None,
    content_type: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if content_type:
        query = query.filter(Task.content_type == content_type)
    return query.order_by(Task.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    return task


@router.post("/{task_id}/review", response_model=TaskOut)
def review_task(task_id: int, body: TaskReview, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")
    if task.status != "review":
        raise HTTPException(status_code=400, detail="只有待复核任务可以人工审核")

    task.status = body.action
    task.review_comment = body.comment or ""
    task.updated_at = datetime.now()
    db.commit()
    db.refresh(task)
    return task
