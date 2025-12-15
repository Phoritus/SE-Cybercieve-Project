from pathlib import Path
from dotenv import load_dotenv
# Load test environment variables before importing app modules
env_path = Path(__file__).parent / ".env.test"
load_dotenv(env_path)
from app.db.supabase import Base


import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
    Base.metadata.drop_all(engine)
