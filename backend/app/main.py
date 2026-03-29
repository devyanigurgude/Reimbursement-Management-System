from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError

from app.core.database import create_tables, ensure_schema
from app.routes import auth, users, expenses, approvals

app = FastAPI(
    title="Reimbursement Management API",
    description="Multi-level expense reimbursement system with approval engine",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def global_error_handler(request: Request, call_next):
    try:
        response = await call_next(request)
        return response

    except OperationalError:
        return JSONResponse(
            status_code=503,
            content={
                "detail": "Database unavailable. Check DATABASE_URL and ensure DB is running."
            },
        )

    except Exception as e:
        print("🔥 Internal Server Error:", str(e))  
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"}
        )

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(approvals.router)

@app.on_event("startup")
def on_startup():
    create_tables()
    ensure_schema()

@app.get("/")
def root():
    return {
        "message": "Reimbursement Management API is running",
        "docs": "/docs"
    }
