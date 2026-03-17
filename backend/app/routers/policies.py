from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Policy, Rule
from app.schemas import PolicyCreate, PolicyUpdate, PolicyOut
from app.services.faiss_service import faiss_service

router = APIRouter()


@router.get("/", response_model=list[PolicyOut])
def list_policies(db: Session = Depends(get_db)):
    return db.query(Policy).order_by(Policy.created_at.desc()).all()


@router.post("/", response_model=PolicyOut)
def create_policy(body: PolicyCreate, db: Session = Depends(get_db)):
    policy = Policy(name=body.name, description=body.description, is_active=body.is_active)
    for r in body.rules:
        rule = Rule(
            name=r.name, description=r.description, violation_type=r.violation_type,
            action=r.action, priority=r.priority, is_active=r.is_active,
        )
        policy.rules.append(rule)
    db.add(policy)
    db.commit()
    db.refresh(policy)

    faiss_service.rebuild_from_db(db)
    return policy


@router.get("/{policy_id}", response_model=PolicyOut)
def get_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="策略不存在")
    return policy


@router.put("/{policy_id}", response_model=PolicyOut)
def update_policy(policy_id: int, body: PolicyUpdate, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="策略不存在")

    if body.name is not None:
        policy.name = body.name
    if body.description is not None:
        policy.description = body.description
    if body.is_active is not None:
        policy.is_active = body.is_active

    if body.rules is not None:
        db.query(Rule).filter(Rule.policy_id == policy_id).delete()
        for r in body.rules:
            rule = Rule(
                policy_id=policy_id, name=r.name, description=r.description,
                violation_type=r.violation_type, action=r.action,
                priority=r.priority, is_active=r.is_active,
            )
            db.add(rule)

    db.commit()
    db.refresh(policy)

    faiss_service.rebuild_from_db(db)
    return policy


@router.delete("/{policy_id}")
def delete_policy(policy_id: int, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="策略不存在")
    db.delete(policy)
    db.commit()

    faiss_service.rebuild_from_db(db)
    return {"detail": "删除成功"}
