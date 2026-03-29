from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user, require_role
from app.models.expense import Expense
from app.schemas.schemas import ExpenseCreate, ExpenseOut
from app.services.currency_service import convert_currency
from app.services.approval_engine import create_approval_requests
from app.services.ocr_service import extract_receipt_data
from app.services.rule_assignment import select_approval_rule

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

@router.get("/", response_model=List[ExpenseOut])
def get_expenses(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role == "employee":
        return db.query(Expense).filter(Expense.employee_id == current_user.id).order_by(Expense.created_at.desc()).all()
    elif current_user.role == "manager":
        subordinate_ids = [u.id for u in current_user.subordinates]
        return db.query(Expense).filter(Expense.employee_id.in_(subordinate_ids)).order_by(Expense.created_at.desc()).all()
    else:
        return db.query(Expense).filter(Expense.company_id == current_user.company_id).order_by(Expense.created_at.desc()).all()

@router.post("/", response_model=ExpenseOut)
def create_expense(data: ExpenseCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    company = current_user.company
    amount_converted = convert_currency(data.amount, data.currency_code, company.currency_code)

    rule = select_approval_rule(
        db,
        company_id=current_user.company_id,
        amount_in_company_currency=amount_converted,
        category=data.category,
        employee_role=current_user.role,
    )

    expense = Expense(
        title=data.title,
        description=data.description,
        amount=data.amount,
        currency_code=data.currency_code,
        amount_in_company_currency=amount_converted,
        category=data.category,
        expense_date=data.expense_date,
        vendor_name=data.vendor_name,
        approval_rule_id=rule.id if rule else None,
        applied_rule_name=rule.name if rule else None,
        employee_id=current_user.id,
        company_id=current_user.company_id,
        state="draft"
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.post("/{expense_id}/submit")
def submit_expense(expense_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.employee_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    if expense.state != "draft":
        raise HTTPException(status_code=400, detail="Expense already submitted")

    # Re-evaluate rule assignment at submit time (rules may have changed since draft)
    rule = select_approval_rule(
        db,
        company_id=current_user.company_id,
        amount_in_company_currency=expense.amount_in_company_currency or expense.amount,
        category=expense.category,
        employee_role=current_user.role,
    )
    expense.approval_rule_id = rule.id if rule else None
    expense.applied_rule_name = rule.name if rule else None
    db.commit()
    db.refresh(expense)

    create_approval_requests(db, expense)
    return {"message": "Expense submitted for approval", "state": expense.state}

@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(expense_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense

@router.get("/{expense_id}/approvals")
def get_expense_approvals(expense_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    from app.models.approval_request import ApprovalRequest
    from app.models.user import User
    reqs = db.query(ApprovalRequest).filter(ApprovalRequest.expense_id == expense_id).order_by(ApprovalRequest.sequence).all()
    result = []
    for r in reqs:
        approver = db.query(User).filter(User.id == r.approver_id).first()
        result.append({
            "id": r.id,
            "approver_name": approver.name if approver else "Unknown",
            "sequence": r.sequence,
            "state": r.state,
            "comment": r.comment,
            "acted_at": r.acted_at,
            "is_manager_step": r.is_manager_step
        })
    return result

@router.post("/ocr/scan")
async def scan_receipt(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    contents = await file.read()
    mime_type = file.content_type or "image/jpeg"
    result = extract_receipt_data(contents, mime_type)
    return result

@router.get("/categories/list")
def get_categories():
    from app.models.expense import EXPENSE_CATEGORIES
    return EXPENSE_CATEGORIES
