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
    allow_origins=["*"],  # change in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DB POOL =================
@app.on_event("startup")
async def startup():
    app.state.db = await asyncpg.create_pool(DATABASE_URL)

    async with app.state.db.acquire() as conn:
        # USERS TABLE
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        """)

        # EXPENSES TABLE (Updated with 'date' column)
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
        
        # Check if 'date' column exists for old databases, add if missing
        await conn.execute("""
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='expenses' AND column_name='date') THEN
                    ALTER TABLE expenses ADD COLUMN date TEXT DEFAULT CURRENT_DATE::TEXT;
                END IF;
            END $$;
        """)

    print("✅ Tables created / verified")

@app.on_event("shutdown")
async def shutdown():
    await app.state.db.close()

# ================= MODELS =================
class User(BaseModel):
    email: str
    password: str

# Updated Expense Model to include date
class Expense(BaseModel):
    title: str
    amount: float
    category: str
    date: str 

# ================= AUTH =================
@app.post("/register")
async def register(user: User):
    try:
        async with app.state.db.acquire() as conn:
            await conn.execute(
                "INSERT INTO users (email, password) VALUES ($1, $2)",
                user.email,
                hash_password(user.password),
            )
        return {"message": "User registered successfully"}
    except:
        raise HTTPException(status_code=400, detail="User already exists")

@app.post("/login")
async def login(user: User):
    async with app.state.db.acquire() as conn:
        db_user = await conn.fetchrow(
            "SELECT * FROM users WHERE email=$1",
            user.email,
        )

    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password. Please try again.")

    token = create_access_token({"user_id": db_user["id"]})
    return {
        "access_token": token,
        "token_type": "bearer"
    }

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
