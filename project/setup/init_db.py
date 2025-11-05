import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from config import DB_CONFIG

def create_database():
    """Create the database if it doesn't exist"""
    try:
        # Connect to PostgreSQL server (default postgres database)
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            database='postgres'  # Connect to default database
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()

        # Check if database exists
        cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_CONFIG['database']}'")
        exists = cur.fetchone()

        if not exists:
            cur.execute(f"CREATE DATABASE {DB_CONFIG['database']}")
            print(f"✅ Database '{DB_CONFIG['database']}' created successfully!")
        else:
            print(f"ℹ️  Database '{DB_CONFIG['database']}' already exists.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        raise

def create_tables():
    """Create all required tables"""
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        cur = conn.cursor()

        # Create users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                pass VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✅ Table 'users' created successfully!")

        # Create movies table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS movies (
                movie_id SERIAL PRIMARY KEY,
                movie_name VARCHAR(255) NOT NULL,
                genre VARCHAR(100) NOT NULL,
                ratings DECIMAL(3, 1) CHECK (ratings >= 0 AND ratings <= 10),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("✅ Table 'movies' created successfully!")

        # Create likes table (junction table for user-movie likes)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS likes (
                like_id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                movie_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (movie_id) REFERENCES movies(movie_id) ON DELETE CASCADE,
                UNIQUE(user_id, movie_id)
            );
        """)
        print("✅ Table 'likes' created successfully!")

        # Create indexes for better query performance
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_likes_movie_id ON likes(movie_id);
        """)
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre);
        """)
        print("✅ Indexes created successfully!")

        conn.commit()
        cur.close()
        conn.close()
        print("\n🎉 All tables created successfully!")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

def insert_sample_data():
    """Insert sample movie data for testing"""
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password']
        )
        cur = conn.cursor()

        # Check if movies table is empty
        cur.execute("SELECT COUNT(*) FROM movies;")
        count = cur.fetchone()[0]

        if count == 0:
            # Sample movies data
            sample_movies = [
                ('The Shawshank Redemption', 'Drama', 9.3),
                ('The Godfather', 'Crime', 9.2),
                ('The Dark Knight', 'Action', 9.0),
                ('Pulp Fiction', 'Crime', 8.9),
                ('Forrest Gump', 'Drama', 8.8),
                ('Inception', 'Action', 8.8),
                ('Fight Club', 'Drama', 8.8),
                ('The Matrix', 'Action', 8.7),
                ('Goodfellas', 'Crime', 8.7),
                ('The Silence of the Lambs', 'Thriller', 8.6),
                ('Se7en', 'Thriller', 8.6),
                ('Interstellar', 'Sci-Fi', 8.6),
                ('The Green Mile', 'Drama', 8.6),
                ('Saving Private Ryan', 'War', 8.6),
                ('The Prestige', 'Thriller', 8.5),
                ('Gladiator', 'Action', 8.5),
                ('The Departed', 'Crime', 8.5),
                ('The Lion King', 'Animation', 8.5),
                ('Whiplash', 'Drama', 8.5),
                ('The Avengers', 'Action', 8.0),
            ]

            cur.executemany(
                "INSERT INTO movies (movie_name, genre, ratings) VALUES (%s, %s, %s)",
                sample_movies
            )
            conn.commit()
            print(f"✅ Inserted {len(sample_movies)} sample movies!")
        else:
            print(f"ℹ️  Movies table already contains {count} records. Skipping sample data insertion.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"❌ Error inserting sample data: {e}")
        raise

def init_database():
    """Main function to initialize the complete database"""
    print("🚀 Starting database initialization...\n")

    try:
        # Step 1: Create database
        create_database()

        # Step 2: Create tables
        create_tables()

        # Step 3: Insert sample data
        insert_sample_data()

        print("\n✅ Database initialization completed successfully!")
        print("\n📊 You can now run the FastAPI application with: uvicorn main:app --reload")

    except Exception as e:
        print(f"\n❌ Database initialization failed: {e}")
        return False

    return True

if __name__ == "__main__":
    init_database()
