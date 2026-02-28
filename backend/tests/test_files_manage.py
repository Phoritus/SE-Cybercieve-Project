"""Tests for files_manage.VirusTotalService (e.g. check_file_type)."""
import tempfile
from pathlib import Path

import pytest

from app.services.files_manage import VirusTotalService


def test_check_file_type_from_filename_txt():
    """Test from filename (e.g. from upload) -> .txt"""
    from app.db.supabase import SessionLocal
    db = SessionLocal()
    try:
        svc = VirusTotalService(db=db)
        out = svc.check_file_type(filename="doc.txt")
        assert out is not None
        assert out == ".txt"
    finally:
        db.close()


def test_check_file_type_from_bytes_plain_text():
    """Test from bytes (no file required) -> extension from MIME e.g. .txt"""
    from app.db.supabase import SessionLocal
    db = SessionLocal()
    try:
        svc = VirusTotalService(db=db)
        out = svc.check_file_type(file_content=b"hello")
        assert out is not None
        assert out == ".txt"
    finally:
        db.close()


def test_check_file_type_from_filename_exe():
    """From filename like BlueJ.exe should get .exe for DB storage."""
    from app.db.supabase import SessionLocal
    db = SessionLocal()
    try:
        svc = VirusTotalService(db=db)
        out = svc.check_file_type(filename="BlueJ.exe")
        assert out == ".exe"
    finally:
        db.close()


def test_check_file_type_no_extension_returns_none():
    """Files without extension (e.g. README, Makefile) should return None."""
    from app.db.supabase import SessionLocal
    db = SessionLocal()
    try:
        svc = VirusTotalService(db=db)
        assert svc.check_file_type(filename="README") is None
        assert svc.check_file_type(filename="Makefile") is None
    finally:
        db.close()


def test_check_file_type_compound_extension():
    """Should return full extension for compound extensions like .tar.gz."""
    from app.db.supabase import SessionLocal
    db = SessionLocal()
    try:
        svc = VirusTotalService(db=db)
        out = svc.check_file_type(filename="archive.tar.gz")
        assert out == ".tar.gz"
    finally:
        db.close()


def test_check_file_type_no_input_returns_none():
    """No path or content should return None."""
    from app.db.supabase import SessionLocal
    db = SessionLocal()
    try:
        svc = VirusTotalService(db=db)
        out = svc.check_file_type()
        assert out is None
    finally:
        db.close()
