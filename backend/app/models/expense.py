from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Float, nullable=False)
    currency_code = Column(String(10), nullable=False)
    amount_in_company_currency = Column(Float, nullable=True)
    category = Column(String, nullable=False)
    expense_date = Column(DateTime, nullable=False)
    receipt_url = Column(String, nullable=True)
    vendor_name = Column(String, nullable=True)
    state = Column(String, default="draft")  # draft, waiting, approved, rejected
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    approval_rule_id = Column(Integer, ForeignKey("approval_rules.id"), nullable=True)
    applied_rule_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    employee = relationship("User", back_populates="expenses", foreign_keys=[employee_id])
    company = relationship("Company", back_populates="expenses")
    approval_rule = relationship("ApprovalRule", back_populates="expenses")
    approval_requests = relationship("ApprovalRequest", back_populates="expense", cascade="all, delete-orphan")

EXPENSE_CATEGORIES = ["Food", "Travel", "Accommodation", "Office Supplies", "Medical", "Entertainment", "Other"]
