from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncpg
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
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DB POOL =================
@app.on_event("startup")
async def startup():
    app.state.db = await asyncpg.create_pool(DATABASE_URL)

    async with app.state.db.acquire() as conn:
        # 1. USERS TABLE
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        """)

        # Migration: Add username to existing users table if it doesn't exist
        await conn.execute("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='users' AND column_name='username') THEN
                    ALTER TABLE users ADD COLUMN username TEXT;
                END IF;
            END $$;
        """)

        # 2. EXPENSES TABLE
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                amount NUMERIC(10,2) NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL, 
                date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        
        await conn.execute("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='expenses' AND column_name='date') THEN
                    ALTER TABLE expenses ADD COLUMN date TEXT DEFAULT CURRENT_DATE::TEXT;
                END IF;
            END $$;
        """)

    print("✅ Tables and Columns verified")

@app.on_event("shutdown")
async def shutdown():
    await app.state.db.close()

# ================= MODELS =================
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class Expense(BaseModel):
    title: str
    amount: float
    category: str
    date: str 

# ================= AUTH & USER ROUTES =================

@app.post("/register")
async def register(user: UserRegister):
    try:
        async with app.state.db.acquire() as conn:
            await conn.execute(
                "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
                user.username,
                user.email,
                hash_password(user.password),
            )
        return {"message": "User registered successfully"}
    except Exception:
        raise HTTPException(status_code=400, detail="User already exists or Invalid data")

@app.post("/login")
async def login(user: UserLogin):
    async with app.state.db.acquire() as conn:
        db_user = await conn.fetchrow(
            "SELECT * FROM users WHERE email=$1",
            user.email,
        )

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token({"user_id": db_user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer"
    }

# NEW: Fetch Current User Profile for the Header
@app.get("/me")
async def get_me(user_id: int = Depends(get_current_user)):
    try:
        async with app.state.db.acquire() as conn:
            user = await conn.fetchrow(
                "SELECT username, email FROM users WHERE id = $1",
                user_id
            )

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            return {
                "username": user["username"] or "User",
                "email": user["email"]
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"BACKEND ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================= EXPENSES (JWT PROTECTED) =================
@app.get("/expenses")
async def get_expenses(user_id: int = Depends(get_current_user)):
    async with app.state.db.acquire() as conn:
        # Added 'date' to SELECT
        data = await conn.fetch("""
            SELECT id, title, amount, category, date, date_created
            FROM expenses
            WHERE user_id=$1
            ORDER BY date DESC, id DESC
        """, user_id)

    return [dict(row) for row in data]

@app.post("/expenses")
async def add_expense(
    expense: Expense,
    user_id: int = Depends(get_current_user)
):
    try:
        async with app.state.db.acquire() as conn:
            # Added 'date' to INSERT
            await conn.execute("""
                INSERT INTO expenses (title, amount, category, date, user_id)
                VALUES ($1, $2, $3, $4, $5)
            """,
            expense.title,
            expense.amount,
            expense.category,
            expense.date,
            user_id,
            )

        return {"status": "success"}

    except Exception as e:
        print("❌ ADD EXPENSE ERROR:", e)
        raise HTTPException(status_code=500, detail="Failed to add expense")

@app.put("/expenses/{expense_id}")
async def update_expense(
    expense_id: int,
    expense: Expense,
    user_id: int = Depends(get_current_user)
):
    async with app.state.db.acquire() as conn:
        # Added 'date' to UPDATE
        await conn.execute("""
            UPDATE expenses
            SET title=$1, amount=$2, category=$3, date=$4
            WHERE id=$5 AND user_id=$6
        """,
        expense.title,
        expense.amount,
        expense.category,
        expense.date,
        expense_id,
        user_id,
        )

    return {"status": "updated"}

@app.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    user_id: int = Depends(get_current_user)
):
    async with app.state.db.acquire() as conn:
        await conn.execute(
            "DELETE FROM expenses WHERE id=$1 AND user_id=$2",
            expense_id,
            user_id,
        )

    return {"status": "deleted"}
