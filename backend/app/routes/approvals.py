from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.models.approval_request import ApprovalRequest
from app.models.approval_rule import ApprovalRule, ApprovalRuleLine
from app.models.expense import Expense
from app.models.user import User
from app.schemas.schemas import ApprovalAction, ApprovalRuleCreate, ApprovalRuleOut
from app.services.approval_engine import process_approval

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])

# ── Approval Requests ─────────────────────────────────
@router.get("/pending")
def get_pending_approvals(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    reqs = db.query(ApprovalRequest).filter(
        ApprovalRequest.approver_id == current_user.id,
        ApprovalRequest.state == "pending",
        ApprovalRequest.is_active == True,  # noqa: E712
    ).all()
    result = []
    for r in reqs:
        expense = db.query(Expense).filter(Expense.id == r.expense_id).first()
        if not expense or expense.state != "waiting":
            continue
        employee = db.query(User).filter(User.id == expense.employee_id).first() if expense else None
        result.append({
            "request_id": r.id,
            "expense_id": r.expense_id,
            "expense_title": expense.title if expense else "",
            "employee_name": employee.name if employee else "",
            "amount": expense.amount_in_company_currency if expense else 0,
            "currency": expense.company.currency_code if expense and expense.company else "",
            "category": expense.category if expense else "",
            "state": r.state,
            "sequence": r.sequence,
            "created_at": r.created_at
        })
    return result

@router.get("/summary")
def get_approval_summary(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    base_q = db.query(ApprovalRequest).filter(ApprovalRequest.approver_id == current_user.id)
    return {
        "pending": base_q.filter(ApprovalRequest.state == "pending", ApprovalRequest.is_active == True).count(),  # noqa: E712
        "approved": base_q.filter(ApprovalRequest.state == "approved").count(),
        "rejected": base_q.filter(ApprovalRequest.state == "rejected").count()
    }

@router.post("/{request_id}/approve")
def approve_request(request_id: int, data: ApprovalAction, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id, ApprovalRequest.approver_id == current_user.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or not yours")
    expense = db.query(Expense).filter(Expense.id == req.expense_id).first()
    result = process_approval(db, expense, current_user.id, "approved", data.comment)
    return result

@router.post("/{request_id}/reject")
def reject_request(request_id: int, data: ApprovalAction, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id, ApprovalRequest.approver_id == current_user.id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or not yours")
    expense = db.query(Expense).filter(Expense.id == req.expense_id).first()
    result = process_approval(db, expense, current_user.id, "rejected", data.comment)
    return result

# ── Approval Rules ────────────────────────────────────
@router.get("/rules", response_model=List[ApprovalRuleOut])
def get_rules(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return db.query(ApprovalRule).filter(ApprovalRule.company_id == current_user.company_id).all()

@router.post("/rules", response_model=ApprovalRuleOut)
def create_rule(data: ApprovalRuleCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    rule = ApprovalRule(
        name=data.name,
        description=data.description,
        company_id=current_user.company_id,
        is_manager_approver=data.is_manager_approver,
        use_sequence=data.use_sequence,
        min_approval_percentage=data.min_approval_percentage,
        min_amount=data.min_amount,
        max_amount=data.max_amount,
        category=data.category,
        employee_role=data.employee_role,
        priority=data.priority,
        is_auto_approve=data.is_auto_approve,
    )
    db.add(rule)
    db.flush()
    for line_data in data.approver_lines:
        line = ApprovalRuleLine(
            rule_id=rule.id,
            approver_id=line_data.approver_id,
            sequence=line_data.sequence,
            is_key_approver=line_data.is_key_approver
        )
        db.add(line)
    db.commit()
    db.refresh(rule)
    return rule

@router.get("/rules/{rule_id}")
def get_rule(rule_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rule = db.query(ApprovalRule).filter(ApprovalRule.id == rule_id, ApprovalRule.company_id == current_user.company_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {
        "id": rule.id,
        "name": rule.name,
        "description": rule.description,
        "is_manager_approver": rule.is_manager_approver,
        "use_sequence": rule.use_sequence,
        "min_approval_percentage": rule.min_approval_percentage,
        "min_amount": rule.min_amount,
        "max_amount": rule.max_amount,
        "category": rule.category,
        "employee_role": rule.employee_role,
        "priority": rule.priority,
        "is_auto_approve": rule.is_auto_approve,
        "approver_lines": [
            {"id": l.id, "approver_id": l.approver_id, "approver_name": l.approver.name, "sequence": l.sequence, "is_key_approver": l.is_key_approver}
            for l in rule.approver_lines
        ]
    }

@router.delete("/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    rule = db.query(ApprovalRule).filter(ApprovalRule.id == rule_id, ApprovalRule.company_id == current_user.company_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted"}
