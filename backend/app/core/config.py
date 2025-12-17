from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()


class Config(BaseSettings):
  USER: Optional[str] = os.getenv("DB_USER")
  PASSWORD: Optional[str] = os.getenv("DB_PASSWORD")
  HOST: Optional[str] = os.getenv("DB_HOST")
  PORT: Optional[str] = os.getenv("DB_PORT") or "5432"
  DBNAME: Optional[str] = os.getenv("DB_NAME")


class SupabaseConfig(BaseSettings):
  SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
  SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")
  JWKS_URL: Optional[str] = os.getenv("JWKS_URL")
  AUDIENCE: Optional[str] = os.getenv("AUDIENCE")
  ALGORITHM: Optional[str] = os.getenv("ALGORITHM")


config = Config()
supabase_config = SupabaseConfig()

