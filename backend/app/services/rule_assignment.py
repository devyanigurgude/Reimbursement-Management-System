from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.models.approval_rule import ApprovalRule


@dataclass(frozen=True)
class RuleMatch:
    rule: ApprovalRule
    specificity: int


def select_approval_rule(
    db: Session,
    *,
    company_id: int,
    amount_in_company_currency: float,
    category: str,
    employee_role: Optional[str] = None,
) -> Optional[ApprovalRule]:
    rules = (
        db.query(ApprovalRule)
        .filter(ApprovalRule.company_id == company_id)
        .all()
    )

    matches: list[RuleMatch] = []
    for rule in rules:
        if rule.category and rule.category != category:
            continue
        if rule.employee_role and employee_role and rule.employee_role != employee_role:
            continue
        if rule.employee_role and not employee_role:
            continue
        if rule.min_amount is not None and amount_in_company_currency < rule.min_amount:
            continue
        if rule.max_amount is not None and amount_in_company_currency > rule.max_amount:
            continue

        specificity = 0
        if rule.category:
            specificity += 1
        if rule.employee_role:
            specificity += 1
        if rule.min_amount is not None:
            specificity += 1
        if rule.max_amount is not None:
            specificity += 1

        matches.append(RuleMatch(rule=rule, specificity=specificity))

    if not matches:
        return None

    matches.sort(
        key=lambda m: (
            m.rule.priority if m.rule.priority is not None else 100,
            -m.specificity,
            m.rule.created_at,
            m.rule.id,
        )
    )
    return matches[0].rule

