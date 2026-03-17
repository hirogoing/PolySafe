from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ---- Task ----
class TaskCreate(BaseModel):
    content_type: str
    content_text: Optional[str] = ""


class TaskOut(BaseModel):
    id: int
    batch_id: Optional[int] = None
    original_filename: str
    content_type: str
    content_url: str
    content_text: str
    status: str
    ai_result: str
    matched_rules: str
    confidence: float
    violation_types: str
    risk_description: str
    review_comment: str
    process_logs: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskReview(BaseModel):
    action: str  # pass / block
    comment: Optional[str] = ""


# ---- Batch ----
class BatchTaskOut(BaseModel):
    id: int
    original_filename: str
    content_type: str
    status: str
    confidence: float
    violation_types: str
    risk_description: str
    created_at: datetime

    class Config:
        from_attributes = True


class BatchOut(BaseModel):
    id: int
    name: str
    total_count: int
    created_at: datetime
    updated_at: datetime
    tasks: list[BatchTaskOut] = []

    # computed summary fields
    pass_count: int = 0
    block_count: int = 0
    review_count: int = 0
    error_count: int = 0
    pending_count: int = 0
    done_count: int = 0

    class Config:
        from_attributes = True


# ---- Rule ----
class RuleCreate(BaseModel):
    name: str
    description: str = ""
    violation_type: str
    action: str = "block"
    priority: int = 0
    is_active: bool = True


class RuleOut(BaseModel):
    id: int
    policy_id: int
    name: str
    description: str
    violation_type: str
    action: str
    priority: int
    is_active: bool

    class Config:
        from_attributes = True


# ---- Policy ----
class PolicyCreate(BaseModel):
    name: str
    description: str = ""
    is_active: bool = True
    rules: list[RuleCreate] = []


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    rules: Optional[list[RuleCreate]] = None


class PolicyOut(BaseModel):
    id: int
    name: str
    description: str
    is_active: bool
    created_at: datetime
    rules: list[RuleOut] = []

    class Config:
        from_attributes = True


# ---- Dashboard ----
class DashboardStats(BaseModel):
    total: int
    pass_count: int
    block_count: int
    review_count: int
    error_count: int
    pass_rate: float
    block_rate: float


class DailyTrend(BaseModel):
    date: str
    total: int
    pass_count: int
    block_count: int
    review_count: int


class ViolationDist(BaseModel):
    type: str
    count: int
