from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime

# ── Auth ──────────────────────────────────────────────
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: str
    country: str
    currency_code: str
    currency_symbol: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ── User ──────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "employee"
    manager_id: Optional[int] = None
    is_manager_approver: bool = False

class UserUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    manager_id: Optional[int] = None
    is_manager_approver: Optional[bool] = None

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    is_manager_approver: bool
    manager_id: Optional[int]
    company_id: int
    class Config:
        from_attributes = True

# ── Expense ───────────────────────────────────────────
class ExpenseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    description: Optional[str] = None
    amount: float
    currency_code: str
    category: str
    expense_date: datetime
    vendor_name: Optional[str] = None

class ExpenseOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    amount: float
    currency_code: str
    amount_in_company_currency: Optional[float]
    category: str
    expense_date: datetime
    vendor_name: Optional[str]
    state: str
    employee_id: int
    approval_rule_id: Optional[int]
    applied_rule_name: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

# ── Approval Rule ─────────────────────────────────────
class ApprovalRuleLineCreate(BaseModel):
    approver_id: int
    sequence: int
    is_key_approver: bool = False

class ApprovalRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_manager_approver: bool = False
    use_sequence: bool = True
    min_approval_percentage: float = 100.0
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    category: Optional[str] = None
    employee_role: Optional[str] = None
    priority: int = 100
    is_auto_approve: bool = False
    approver_lines: List[ApprovalRuleLineCreate] = []

class ApprovalRuleOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    is_manager_approver: bool
    use_sequence: bool
    min_approval_percentage: float
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    category: Optional[str] = None
    employee_role: Optional[str] = None
    priority: int
    is_auto_approve: bool
    class Config:
        from_attributes = True

# ── Approval Request ──────────────────────────────────
class ApprovalAction(BaseModel):
    comment: Optional[str] = None

class ApprovalRequestOut(BaseModel):
    id: int
    expense_id: int
    approver_id: int
    sequence: int
    is_active: bool
    state: str
    comment: Optional[str]
    acted_at: Optional[datetime]
    created_at: datetime
    class Config:
        from_attributes = True
