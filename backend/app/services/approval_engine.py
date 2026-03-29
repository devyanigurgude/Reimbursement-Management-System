from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.models.approval_request import ApprovalRequest
from app.models.approval_rule import ApprovalRule
from app.services.currency_service import convert_currency

def create_approval_requests(db: Session, expense: Expense):
    rule: ApprovalRule = expense.approval_rule
    if not rule or getattr(rule, "is_auto_approve", False):
        expense.state = "approved"
        if not expense.applied_rule_name:
            expense.applied_rule_name = rule.name if rule else "Auto-approved"
        db.commit()
        return

    sequence = 1
    created_any = False
    added_approver_ids = set()
    sequential = bool(getattr(rule, "use_sequence", True))

    # Step 1: If is_manager_approver and employee has a manager, add manager first
    if rule.is_manager_approver and expense.employee.manager_id:
        manager_id = expense.employee.manager_id
        if manager_id and manager_id != expense.employee_id and manager_id not in added_approver_ids:
            manager_req = ApprovalRequest(
                expense_id=expense.id,
                approver_id=manager_id,
                sequence=sequence,
                is_manager_step=True,
                is_active=(True if not sequential else sequence == 1),
                state="pending"
            )
            db.add(manager_req)
            added_approver_ids.add(manager_id)
            sequence += 1
            created_any = True

    # Step 2: Add rule approvers in sequence
    for line in sorted(rule.approver_lines, key=lambda l: (l.sequence or 0, l.id or 0)):
        if line.approver_id == expense.employee_id:
            continue
        if line.approver_id in added_approver_ids:
            continue
        req = ApprovalRequest(
            expense_id=expense.id,
            approver_id=line.approver_id,
            sequence=sequence,
            is_manager_step=False,
            is_active=(True if not sequential else sequence == 1),
            state="pending"
        )
        db.add(req)
        added_approver_ids.add(line.approver_id)
        sequence += 1
        created_any = True

    # If the rule doesn't actually produce any approvers, auto-approve to avoid a stuck "waiting" expense.
    if not created_any:
        expense.state = "approved"
        db.commit()
        return

    expense.state = "waiting"
    db.commit()
    if sequential:
        _activate_next(db, expense)


def process_approval(db: Session, expense: Expense, approver_id: int, action: str, comment: str = None):
    rule = expense.approval_rule
    sequential = bool(rule and getattr(rule, "use_sequence", True))

    # Find the current pending request for this approver
    q = db.query(ApprovalRequest).filter(
        ApprovalRequest.expense_id == expense.id,
        ApprovalRequest.approver_id == approver_id,
        ApprovalRequest.state == "pending"
    )
    if sequential:
        q = q.filter(ApprovalRequest.is_active == True)  # noqa: E712
    current_req = q.first()

    if not current_req:
        return {"error": "No pending approval request found for you"}

    current_req.state = action  # "approved" or "rejected"
    current_req.comment = comment
    current_req.acted_at = datetime.utcnow()
    current_req.is_active = False
    db.commit()

    if action == "rejected":
        expense.state = "rejected"
        _cancel_remaining(db, expense, except_request_id=current_req.id)
        db.commit()
        return {"status": "rejected"}

    # Check conditional rules
    if not rule:
        expense.state = "approved"
        db.commit()
        return {"status": "approved", "reason": "no rule"}

    all_requests = db.query(ApprovalRequest).filter(
        ApprovalRequest.expense_id == expense.id
    ).all()

    considered = [r for r in all_requests if r.state != "cancelled"]
    total = len(considered)
    approved_count = sum(1 for r in considered if r.state == "approved")

    # Check key approver rule (specific approver auto-approves)
    key_approved = any(
        r.state == "approved" and
        any(line.approver_id == r.approver_id and line.is_key_approver for line in rule.approver_lines)
        for r in considered
    )

    if key_approved:
        expense.state = "approved"
        _cancel_remaining(db, expense)
        db.commit()
        return {"status": "approved", "reason": "key approver approved"}

    # Check percentage rule
    if total > 0 and (approved_count / total * 100) >= rule.min_approval_percentage:
        expense.state = "approved"
        _cancel_remaining(db, expense)
        db.commit()
        return {"status": "approved", "reason": "percentage threshold met"}

    # Move to next approver
    if sequential:
        result = _activate_next(db, expense)
        if result == "done":
            expense.state = "approved"
            db.commit()
            return {"status": "approved", "reason": "all approved"}
        return {"status": "waiting_next"}

    pending_left = any(r.state == "pending" for r in considered)
    if not pending_left:
        expense.state = "approved"
        db.commit()
        return {"status": "approved", "reason": "all approved"}

    expense.state = "waiting"
    db.commit()
    return {"status": "waiting_next"}


def _activate_next(db: Session, expense: Expense):
    rule = expense.approval_rule
    if not rule or not getattr(rule, "use_sequence", True):
        return "done"

    all_requests = db.query(ApprovalRequest).filter(
        ApprovalRequest.expense_id == expense.id
    ).order_by(ApprovalRequest.sequence).all()

    # Ensure only one active pending request at a time
    for req in all_requests:
        if req.state == "pending":
            req.is_active = False

    for req in all_requests:
        if req.state == "pending":
            req.is_active = True
            db.commit()
            return "activated"

    return "done"


def get_pending_for_approver(db: Session, approver_id: int):
    return db.query(ApprovalRequest).filter(
        ApprovalRequest.approver_id == approver_id,
        ApprovalRequest.state == "pending",
        ApprovalRequest.is_active == True,  # noqa: E712
    ).all()


def _cancel_remaining(db: Session, expense: Expense, except_request_id: Optional[int] = None):
    q = db.query(ApprovalRequest).filter(
        ApprovalRequest.expense_id == expense.id,
        ApprovalRequest.state == "pending",
    )
    if except_request_id is not None:
        q = q.filter(ApprovalRequest.id != except_request_id)
    q.update({ApprovalRequest.state: "cancelled", ApprovalRequest.is_active: False}, synchronize_session=False)
