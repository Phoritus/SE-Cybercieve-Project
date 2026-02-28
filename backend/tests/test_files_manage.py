"""Tests for files_manage.VirusTotalService."""
import pytest

from app.services.files_manage import VirusTotalService


def test_compute_hash():
    """SHA-256 hash should be deterministic."""
    from app.db.supabase import SessionLocal
    db = SessionLocal()
    try:
        svc = VirusTotalService(db=db)
        h = svc._compute_hash(b"hello")
        assert isinstance(h, str)
        assert len(h) == 64  # SHA-256 hex digest length
        # Same input should produce same hash
        assert h == svc._compute_hash(b"hello")
    finally:
        db.close()
