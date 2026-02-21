import json
import re
from uuid import UUID
from app.core.config import config, supabase_config
from sqlalchemy import create_engine, String
from sqlalchemy.engine.url import URL
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from sqlalchemy.orm import validates
from supabase import create_client, Client

# Create supabase client
supabase_client: Client = create_client(supabase_config.SUPABASE_URL, supabase_config.SUPABASE_KEY)

# Construct the SQLAlchemy connection string
DATABASE_URL = URL.create(
    drivername="postgresql",
    username=config.USER,
    password=config.PASSWORD,
    host=config.HOST,
    port=config.PORT,
    database=config.DBNAME
)
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

# Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)


# Test the connection
try:
    with engine.connect() as connection:
        print("Connection successful!✅")
except Exception as e:
    print(f"Failed to connect: {e}❌")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass

# Create table


class User(Base):
    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(primary_key=True, nullable=False)
    username: Mapped[str | None] = mapped_column(
        String(50), unique=True, nullable=True)
    first_name: Mapped[str | None] = mapped_column(
        String(50), nullable=True)
    last_name: Mapped[str | None] = mapped_column(
        String(50), nullable=True)
    email: Mapped[str] = mapped_column(String(50), unique=True)

    @validates("email")
    def validate_email(self, key, email):
        if not EMAIL_REGEX.match(email):
            raise ValueError("Invalid email format")
        return email

class File(Base):
    __tablename__ = "files"
    file_hash: Mapped[str] = mapped_column(String(255), primary_key=True, nullable=False)
    analysis_result: Mapped[json] = mapped_column(String, nullable=False)

# Base.metadata.create_all(engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
