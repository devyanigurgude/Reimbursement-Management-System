from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="employee")  # admin, manager, employee
    is_active = Column(Boolean, default=True)
    is_manager_approver = Column(Boolean, default=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    company = relationship("Company", back_populates="users")
    manager = relationship("User", remote_side=[id], foreign_keys=[manager_id])
    subordinates = relationship("User", foreign_keys=[manager_id])
    expenses = relationship("Expense", back_populates="employee", foreign_keys="Expense.employee_id")
    approval_requests = relationship("ApprovalRequest", back_populates="approver", foreign_keys="ApprovalRequest.approver_id")
