from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_access_token
from app.models.company import Company
from app.models.user import User
from app.schemas.schemas import SignupRequest, LoginRequest, TokenResponse
from app.services.currency_service import get_all_countries

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/signup", response_model=TokenResponse)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    company = Company(
        name=data.company_name,
        country=data.country,
        currency_code=data.currency_code,
        currency_symbol=data.currency_symbol
    )
    db.add(company)
    db.flush()

    admin = User(
        name=data.name,
        email=data.email,
        hashed_password=_safe_hash_password(data.password),
        role="admin",
        company_id=company.id
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    token = create_access_token({"sub": str(admin.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": admin.id, "name": admin.name, "email": admin.email, "role": admin.role, "company_id": admin.company_id}
    }

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role, "company_id": user.company_id}
    }

@router.get("/countries")
def list_countries():
    return get_all_countries()

@router.get("/me")
def get_me(current_user=Depends(__import__("app.core.auth", fromlist=["get_current_user"]).get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "company_id": current_user.company_id,
        "is_manager_approver": current_user.is_manager_approver,
        "manager_id": current_user.manager_id
    }


def _safe_hash_password(password: str) -> str:
    try:
        return hash_password(password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
