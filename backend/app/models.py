from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), default="")
    total_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    tasks = relationship("Task", back_populates="batch", lazy="joined")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=True)
    original_filename = Column(String(500), default="")
    content_type = Column(String(20), nullable=False)  # image / video / text
    content_url = Column(String(500), default="")
    content_text = Column(Text, default="")
    status = Column(String(20), default="pending")  # pending / pass / block / review / error
    ai_result = Column(Text, default="")  # JSON: AI模型分析结果
    matched_rules = Column(Text, default="")  # JSON: 命中的规则列表
    confidence = Column(Float, default=0.0)
    violation_types = Column(String(200), default="")
    risk_description = Column(Text, default="")
    review_comment = Column(Text, default="")
    process_logs = Column(Text, default="")  # JSON: 任务处理过程日志
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    batch = relationship("Batch", back_populates="tasks")


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)

    rules = relationship("Rule", back_populates="policy", cascade="all, delete-orphan")


class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, default="")
    violation_type = Column(String(50), nullable=False)  # porn / violence / hate / spam / illegal / other
    action = Column(String(20), default="block")  # block / review / pass
    priority = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    policy = relationship("Policy", back_populates="rules")
