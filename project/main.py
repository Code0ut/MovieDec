from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
import psycopg2
from psycopg2.extras import RealDictCursor
from utils import hash_password, verify_password, create_access_token
from config import DB_CONFIG
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict to specific origins e.g., ["http://127.0.0.1:5500"]
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)
def get_db_connection():
    conn = psycopg2.connect(
        host=DB_CONFIG['host'],
        database=DB_CONFIG['database'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        cursor_factory=RealDictCursor
    )
    return conn

@app.get("/")
def home():
    return {"message": "🎬 FastAPI Movie API is running!"}

@app.post("/register")
def register_user(username: str, password: str):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute('SELECT * FROM "users" WHERE name = %s;', (username,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pass = hash_password(password)
    cur.execute('INSERT INTO "users" (name, pass) VALUES (%s, %s);', (username, hashed_pass))
    conn.commit()
    conn.close()

    return {"message": "User registered successfully!"}

@app.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM "users" WHERE name = %s;', (form_data.username,))
    user = cur.fetchone()
    conn.close()

    if not user or not verify_password(form_data.password, user["pass"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": user["name"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/movies")
def get_movies():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT movie_id, movie_name, genre, ratings FROM movies;')
    movies = cur.fetchall()
    conn.close()
    return movies

@app.get("/recommendations/{movie_id}")
def get_recommendations(movie_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    # Get the genre of the selected movie
    cur.execute('SELECT genre FROM movies WHERE movie_id = %s;', (movie_id,))
    genre_row = cur.fetchone()
    if not genre_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Movie not found")

    genre = genre_row['genre']

    # ✅ Recommend movies in the same genre
    # Ordered by number of likes (popularity) first, then ratings
    cur.execute('''
        SELECT 
            m.movie_id,
            m.movie_name,
            m.genre,
            m.ratings,
            COUNT(l.movie_id) AS like_count
        FROM movies m
        LEFT JOIN likes l ON m.movie_id = l.movie_id
        WHERE m.genre = %s AND m.movie_id != %s
        GROUP BY m.movie_id, m.movie_name, m.genre, m.ratings
        ORDER BY like_count DESC, m.ratings DESC
        LIMIT 10;
    ''', (genre, movie_id))

    recommendations = cur.fetchall()
    conn.close()
    return recommendations

@app.post("/like")
def like_movie(user_name: str, movie_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    
    cur.execute('SELECT user_id FROM "users" WHERE name = %s;', (user_name,))
    user_row = cur.fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")

    user_id = user_row['user_id']

    
    cur.execute('SELECT * FROM likes WHERE user_id = %s AND movie_id = %s;', (user_id, movie_id))
    existing = cur.fetchone()

    if existing:
        
        cur.execute('DELETE FROM likes WHERE user_id = %s AND movie_id = %s;', (user_id, movie_id))
        conn.commit()
        conn.close()
        return {"message": "Movie unliked successfully!"}
    else:
        
        cur.execute('INSERT INTO likes (user_id, movie_id) VALUES (%s, %s);', (user_id, movie_id))
        conn.commit()
        conn.close()
        return {"message": "Movie liked successfully!"}
