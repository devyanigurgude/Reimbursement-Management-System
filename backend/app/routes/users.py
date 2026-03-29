from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.auth import get_current_user, require_role, hash_password
from app.models.user import User
from app.schemas.schemas import UserCreate, UserUpdate, UserOut

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/", response_model=List[UserOut])
def get_users(db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    return (
        db.query(User)
        .filter(User.company_id == current_user.company_id, User.is_active == True)  # noqa: E712
        .all()
    )

@router.post("/", response_model=UserOut)
def create_user(data: UserCreate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    user = User(
        name=data.name,
        email=data.email,
        hashed_password=hash_password(data.password),
        role=data.role,
        manager_id=data.manager_id,
        is_manager_approver=data.is_manager_approver,
        company_id=current_user.company_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id, User.company_id == current_user.company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in data.dict(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user=Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id, User.company_id == current_user.company_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    # Soft-delete to avoid FK constraint issues (expenses, approvals, rule lines, manager links).
    db.query(User).filter(User.manager_id == user.id).update({User.manager_id: None}, synchronize_session=False)

    user.is_active = False
    # Free up the email unique constraint so the same email can be reused later.
    user.email = f"{user.email}__deleted__{user.id}"
    db.commit()
    return {"message": "User deleted"}

@router.get("/managers")
def get_managers(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    managers = db.query(User).filter(
        User.company_id == current_user.company_id,
        User.role.in_(["manager", "admin"]),
        User.is_active == True,  # noqa: E712
    ).all()
    return [{"id": m.id, "name": m.name, "email": m.email} for m in managers]
