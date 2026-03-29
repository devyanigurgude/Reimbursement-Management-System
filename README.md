# Reimbursement Management System

A full-stack web application for managing employee expense reimbursements with multi-level approval workflows, OCR receipt scanning, and multi-currency support.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy |
| Auth | JWT Tokens |
| OCR | Gemini API (Free tier) |
| Currency | exchangerate-api.com |
| Countries | restcountries.com |

---

## Prerequisites

Make sure you have installed:
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

---

## Setup Instructions

### Step 1 — Clone & Setup Environment

```bash
# Copy env file
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/reimbursement_db
SECRET_KEY=any_random_long_string_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### Step 2 — Create PostgreSQL Database

```sql
CREATE DATABASE reimbursement_db;
```

Or using terminal:
```bash
createdb reimbursement_db
```

### Step 3 — Backend Setup

```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Add pydantic-settings (needed for config)
pip install pydantic-settings

# Run the backend server
python run.py
```

Backend will start at: http://localhost:8000
API Docs available at: http://localhost:8000/docs

### Step 4 — Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the frontend
npm run dev
```

Frontend will start at: http://localhost:5173

---

## Getting Your Free Gemini API Key

1. Go to https://aistudio.google.com/
2. Click "Get API Key"
3. Create a new API key (free tier gives generous usage)
4. Paste it in `backend/.env` as `GEMINI_API_KEY`

---

## How To Use

### First Time Setup
1. Open http://localhost:5173
2. Click **Sign Up**
3. Enter your name, company name, email, password
4. Select your **country** (this sets the company's default currency automatically)
5. You are now logged in as **Admin**

### Admin Flow
1. Go to **Admin Dashboard**
2. Create **users** (employees and managers)
3. Create **approval rules** (define who approves what, in what sequence)
4. Assign manager relationships to employees

### Employee Flow
1. Login as employee
2. Click **New Expense**
3. Either fill form manually OR click **Scan Receipt** to use OCR
4. Select an approval rule
5. Click **Save & Submit for Approval**

### Manager Flow
1. Login as manager
2. Go to **Manager Dashboard**
3. See all **pending approvals**
4. Add a comment and click **Approve** or **Reject**

---

## Features

- Multi-company support with auto currency setup
- Role-based access (Admin / Manager / Employee)
- OCR receipt scanning via Gemini AI
- Multi-currency expense submission with real-time conversion
- Sequential multi-level approval workflow
- Manager-first approval option
- Conditional rules (% threshold + key approver)
- Full approval timeline per expense
- JWT authentication

---

## Project Structure

```
reimbursement-app/
├── frontend/          React + Vite app
├── backend/           FastAPI app
└── README.md
```
