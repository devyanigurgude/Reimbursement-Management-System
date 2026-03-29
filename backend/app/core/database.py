from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy import inspect, text
from app.core.config import settings

connect_args = {}
engine_kwargs = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    if ":memory:" in settings.DATABASE_URL:
        engine_kwargs["poolclass"] = StaticPool

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    from app.models import user, company, expense, approval_rule, approval_request
    Base.metadata.create_all(bind=engine)

def ensure_schema():
    """
    Lightweight, idempotent schema upgrade for local/dev environments.

    SQLAlchemy's `create_all` does not add new columns to existing tables. If a
    DB was created with an older model version, API queries can fail with
    `UndefinedColumn`. This function adds missing columns that were introduced
    later, without requiring Alembic.
    """
    insp = inspect(engine)

    def _col_names(table_name: str) -> set[str]:
        return {c["name"] for c in insp.get_columns(table_name)}

    dialect = engine.dialect.name
    is_sqlite = dialect == "sqlite"

    # Type helpers (keep to simple, widely supported types).
    t_string = "VARCHAR"
    t_float = "REAL" if is_sqlite else "DOUBLE PRECISION"
    t_int = "INTEGER"
    t_bool = "INTEGER" if is_sqlite else "BOOLEAN"

    upgrades: list[tuple[str, str]] = []

    # expenses.applied_rule_name
    if "expenses" in insp.get_table_names():
        exp_cols = _col_names("expenses")
        if "applied_rule_name" not in exp_cols:
            upgrades.append(("expenses", f"ADD COLUMN applied_rule_name {t_string}"))

    # approval_rules: matching conditions and priority
    if "approval_rules" in insp.get_table_names():
        rule_cols = _col_names("approval_rules")
        if "min_amount" not in rule_cols:
            upgrades.append(("approval_rules", f"ADD COLUMN min_amount {t_float}"))
        if "max_amount" not in rule_cols:
            upgrades.append(("approval_rules", f"ADD COLUMN max_amount {t_float}"))
        if "category" not in rule_cols:
            upgrades.append(("approval_rules", f"ADD COLUMN category {t_string}"))
        if "employee_role" not in rule_cols:
            upgrades.append(("approval_rules", f"ADD COLUMN employee_role {t_string}"))
        if "priority" not in rule_cols:
            upgrades.append(("approval_rules", f"ADD COLUMN priority {t_int} DEFAULT 100"))
        if "is_auto_approve" not in rule_cols:
            default_false = "0" if is_sqlite else "FALSE"
            upgrades.append(("approval_rules", f"ADD COLUMN is_auto_approve {t_bool} DEFAULT {default_false}"))

    # approval_requests.is_active
    if "approval_requests" in insp.get_table_names():
        req_cols = _col_names("approval_requests")
        if "is_active" not in req_cols:
            default_true = "1" if is_sqlite else "TRUE"
            upgrades.append(("approval_requests", f"ADD COLUMN is_active {t_bool} DEFAULT {default_true}"))

    if not upgrades:
        return

    with engine.begin() as conn:
        for table, clause in upgrades:
            conn.execute(text(f"ALTER TABLE {table} {clause}"))

        # Backfill NULLs for older rows (SQLite won't retroactively apply defaults).
        if "approval_requests" in insp.get_table_names():
            true_value = "1" if is_sqlite else "TRUE"
            conn.execute(text(f"UPDATE approval_requests SET is_active = {true_value} WHERE is_active IS NULL"))

        if "approval_rules" in insp.get_table_names():
            false_value = "0" if is_sqlite else "FALSE"
            conn.execute(text("UPDATE approval_rules SET priority = 100 WHERE priority IS NULL"))
            conn.execute(text(f"UPDATE approval_rules SET is_auto_approve = {false_value} WHERE is_auto_approve IS NULL"))
