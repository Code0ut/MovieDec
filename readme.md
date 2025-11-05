# FastAPI Movie Recommendation App Setup Guide

This guide will help you set up, initialize, and run the complete Movie Recommendation backend (FastAPI + PostgreSQL) and frontend (HTML/JS).

## Prerequisites
- **Python 3.8+**
- **PostgreSQL** (locally or on a server)
- **Pip dependencies**: fastapi, uvicorn, psycopg2, passlib, python-jose

## 1. Clone/Extract Files
Ensure you have these essential files in the same project directory:
- `main.py` (FastAPI backend)
- `index.html` (Frontend)
- `init_db.py` (database initializer — script provided)
- `utils.py`, `config.py` (utility and configuration, to be created)

## 2. Install Python Dependencies
Run:
```bash
pip install -r requirements.txt
```

## 3. Configure Database
Edit or create `config.py` in your project directory:
```python
# config.py
DB_CONFIG = {
    'host': 'localhost',      # or your DB host
    'database': 'movie_db',   # choose your DB name  
    'user': 'postgres',       # your postgres user  
    'password': 'YOUR_PASSWORD' # your postgres password
}
```

## 4. Initialize Database
Run this script in your shell:
```bash
python init_db.py
```
This will create the database (if missing), tables, indexes, and insert sample movie data.

## 5. Run the Backend
Launch the FastAPI server with:
```bash
uvicorn main:app --reload
```

## 6. Serve Frontend
Open `index.html` locally (double click or use Python HTTP server):
```bash
python -m http.server 8000
```
Then open [http://localhost:8000/index.html](http://localhost:8000/index.html) in your browser.

## 7. Endpoints Summary
- **POST /register**         - Register a new user
- **POST /login**            - Get JWT token using username/password
- **GET /movies**            - List all movies
- **GET /recommendations/{movie_id}** - Get movie recommendations by genre
- **POST /like**             - Like (toggle) a movie for current user

## 8. Utility
Make sure utility files `utils.py` (password hashing, token management) exist with required functions: `hash_password`, `verify_password`, `create_access_token`.

---

### Troubleshooting
- **Database connection errors**: Check `config.py` settings and PostgreSQL service status
- **ModuleNotFoundError**: Ensure all Python packages are installed, and `utils.py` and `config.py` are present
- **CORS errors**: Edit the CORS settings in `main.py` as necessary (for non-local frontend)

---
