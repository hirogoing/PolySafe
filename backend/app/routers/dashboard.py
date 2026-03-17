from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Task
from app.schemas import DashboardStats, DailyTrend, ViolationDist

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Task).count()
    pass_count = db.query(Task).filter(Task.status == "pass").count()
    block_count = db.query(Task).filter(Task.status == "block").count()
    review_count = db.query(Task).filter(Task.status == "review").count()
    error_count = db.query(Task).filter(Task.status == "error").count()

    return DashboardStats(
        total=total,
        pass_count=pass_count,
        block_count=block_count,
        review_count=review_count,
        error_count=error_count,
        pass_rate=round(pass_count / total * 100, 1) if total > 0 else 0,
        block_rate=round(block_count / total * 100, 1) if total > 0 else 0,
    )


@router.get("/trend", response_model=list[DailyTrend])
def get_trend(days: int = 7, db: Session = Depends(get_db)):
    result = []
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    for i in range(days - 1, -1, -1):
        day_start = today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        base_q = db.query(Task).filter(Task.created_at >= day_start, Task.created_at < day_end)
        result.append(DailyTrend(
            date=day_start.strftime("%m-%d"),
            total=base_q.count(),
            pass_count=base_q.filter(Task.status == "pass").count(),
            block_count=base_q.filter(Task.status == "block").count(),
            review_count=base_q.filter(Task.status == "review").count(),
        ))
    return result


@router.get("/violations", response_model=list[ViolationDist])
def get_violations(db: Session = Depends(get_db)):
    tasks = db.query(Task).filter(Task.violation_types != "").all()
    counter: dict[str, int] = {}
    for t in tasks:
        for v in t.violation_types.split(","):
            v = v.strip()
            if v:
                counter[v] = counter.get(v, 0) + 1

    return [ViolationDist(type=k, count=v) for k, v in sorted(counter.items(), key=lambda x: -x[1])]


@router.get("/recent", response_model=list)
def get_recent(limit: int = 10, db: Session = Depends(get_db)):
    tasks = db.query(Task).order_by(Task.created_at.desc()).limit(limit).all()
    return [
        {
            "id": t.id,
            "content_type": t.content_type,
            "status": t.status,
            "confidence": t.confidence,
            "violation_types": t.violation_types,
            "created_at": t.created_at.isoformat(),
        }
        for t in tasks
    ]
