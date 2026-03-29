from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sequence = Column(Integer, default=1)
    is_manager_step = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    state = Column(String, default="pending")  # pending, approved, rejected
    comment = Column(Text, nullable=True)
    acted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    expense = relationship("Expense", back_populates="approval_requests")
    approver = relationship("User", back_populates="approval_requests", foreign_keys=[approver_id])
