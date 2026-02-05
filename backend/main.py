from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from psycopg2.extras import RealDictCursor
import psycopg2
import os
from dotenv import load_dotenv

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

# ================= ENV =================
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found")

# ================= APP =================
app = FastAPI()

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://finance-manager-f.onrender.com",  # React frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DB =================
def get_connection():
    return psycopg2.connect(DATABASE_URL)

@app.on_event("startup")
def startup():
    conn = get_connection()
    cur = conn.cursor()

    # ---------------- USERS TABLE ----------------
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    """)

    # ---------------- EXPENSES TABLE (BASE) ----------------
    cur.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            amount NUMERIC(10,2) NOT NULL,
            category TEXT NOT NULL,
            date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # ---------------- ADD user_id COLUMN IF MISSING ----------------
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='expenses' AND column_name='user_id';
    """)

    if cur.fetchone() is None:
        cur.execute("""
            ALTER TABLE expenses
            ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
        """)
        print("➕ user_id column added to expenses table")

    conn.commit()
    conn.close()
    print("✅ Tables created / verified successfully")


# ================= MODELS =================
class User(BaseModel):
    email: str
    password: str

class Expense(BaseModel):
    title: str
    amount: float
    category: str

# ================= AUTH =================
@app.post("/register")
def register(user: User):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (email, password) VALUES (%s, %s)",
            (user.email, hash_password(user.password))
        )
        conn.commit()
        return {"message": "User registered successfully"}
    except:
        raise HTTPException(status_code=400, detail="User already exists")
    finally:
        conn.close()

@app.post("/login")
def login(user: User):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("SELECT * FROM users WHERE email=%s", (user.email,))
    db_user = cur.fetchone()
    conn.close()

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"user_id": db_user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer"
    }

# ================= EXPENSES (JWT PROTECTED) =================
@app.get("/expenses")
def get_expenses(user_id: int = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(
        """SELECT id, title, amount, category, date_created
           FROM expenses
           WHERE user_id=%s
           ORDER BY id DESC""",
        (user_id,)
    )
    data = cur.fetchall()
    conn.close()
    return data

@app.post("/expenses")
def add_expense(
    expense: Expense,
    user_id: int = Depends(get_current_user)
):
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO expenses (title, amount, category, user_id)
            VALUES (%s, %s, %s, %s)
            """,
            (expense.title, expense.amount, expense.category, user_id),
        )

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "success"}

    except Exception as e:
        print("❌ ADD EXPENSE ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/expenses/{expense_id}")
def update_expense(
    expense_id: int,
    expense: Expense,
    user_id: int = Depends(get_current_user)
):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """UPDATE expenses
           SET title=%s, amount=%s, category=%s
           WHERE id=%s AND user_id=%s""",
        (expense.title, expense.amount, expense.category, expense_id, user_id),
    )
    conn.commit()
    conn.close()
    return {"status": "updated"}

@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    user_id: int = Depends(get_current_user)
):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "DELETE FROM expenses WHERE id=%s AND user_id=%s",
        (expense_id, user_id),
    )
    conn.commit()
    conn.close()
    return {"status": "deleted"}
