from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ApprovalRule(Base):
    __tablename__ = "approval_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    is_manager_approver = Column(Boolean, default=False)
    use_sequence = Column(Boolean, default=True)
    min_approval_percentage = Column(Float, default=100.0)
    # Matching conditions (nullable = match all)
    min_amount = Column(Float, nullable=True)   # in company currency
    max_amount = Column(Float, nullable=True)   # in company currency
    category = Column(String, nullable=True)    # exact match
    employee_role = Column(String, nullable=True)  # exact match (employee/manager/admin/custom)
    priority = Column(Integer, default=100)     # lower wins
    is_auto_approve = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="approval_rules")
    approver_lines = relationship("ApprovalRuleLine", back_populates="rule", cascade="all, delete-orphan", order_by="ApprovalRuleLine.sequence")
    expenses = relationship("Expense", back_populates="approval_rule")


class ApprovalRuleLine(Base):
    __tablename__ = "approval_rule_lines"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("approval_rules.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sequence = Column(Integer, nullable=False, default=1)
    is_key_approver = Column(Boolean, default=False)

    rule = relationship("ApprovalRule", back_populates="approver_lines")
    approver = relationship("User")
