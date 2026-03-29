from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import create_tables
from app.routes import auth, users, expenses, approvals

app = FastAPI(
    title="Reimbursement Management API",
    description="Multi-level expense reimbursement system with approval engine",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(approvals.router)

@app.on_event("startup")
def on_startup():
    create_tables()

@app.get("/")
def root():
    return {"message": "Reimbursement Management API is running", "docs": "/docs"}
