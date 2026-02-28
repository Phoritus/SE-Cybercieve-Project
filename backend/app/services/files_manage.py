from pathlib import Path
import hashlib
import json
import re

import magic
import requests
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import virus_total_config
from app.db.supabase import File as DBFile
from app.models.files_model import FileCreate, MIME_TO_EXT


class VirusTotalService:
    def __init__(self, db: Session):
        self.db = db
        self.api_key = virus_total_config.VIRUS_TOTAL_API_KEY
        self.base_url = "https://www.virustotal.com/api/v3"
        self.headers = {
            "accept": "application/json",
            "x-apikey": self.api_key,
        }

    def _ext_from_name(self, name: str) -> str | None:
        """Pull extension from path or filename, support compound extensions like .tar.gz"""
        p = Path(name)
        suffixes = p.suffixes
        if not suffixes:
            return None
        return "".join(suffixes)

    def check_file_type(
        self,
        filename: str | None = None,
        file_content: bytes | None = None,
    ) -> str | None:
        """Return file extension from uploaded data (filename sent in upload) e.g. .exe, .pdf
        Use filename first (from tuple sent to VT); if no extension in filename, then use file_content + MIME.
        """
        if filename:
            ext = self._ext_from_name(filename)
            if ext:
                return ext
        if file_content is not None:
            try:
                mime_type = magic.from_buffer(file_content, mime=True)
            except Exception:
                return None
            if mime_type and mime_type in MIME_TO_EXT:
                return MIME_TO_EXT[mime_type]
            if mime_type:
                match = re.search(r"/([a-zA-Z0-9+-]+)$", mime_type)
                if match:
                    return "." + match.group(1).lower()
            return None
        return None

    def _compute_hash(self, file_content: bytes) -> str:
        """Compute SHA-256 hash of file content."""
        return hashlib.sha256(file_content).hexdigest()

    def _get_existing(self, file_hash: str) -> dict | None:
        """Check DB for an existing analysis result. Returns the result dict or None."""
        db_file = self.db.query(DBFile).filter(DBFile.file_hash == file_hash).first()
        if db_file and db_file.analysis_result:
            result = db_file.analysis_result
            if isinstance(result, str):
                try:
                    result = json.loads(result)
                except json.JSONDecodeError:
                    return None
            # Still no real analysis (just save file_type for later)
            if isinstance(result, dict) and (not result or result.get("_pending")):
                return None
            return result
        return None

    def _save_to_db(self, file_create: FileCreate) -> None:
        """Save or update an analysis result in the database."""
        db_file = self.db.query(DBFile).filter(DBFile.file_hash == file_create.file_hash).first()
        if db_file:
            db_file.analysis_result = json.dumps(file_create.analysis_result)
            if file_create.file_type is not None:
                db_file.file_type = file_create.file_type
            self.db.commit()
        else:
            try:
                db_file = DBFile(
                    file_hash=file_create.file_hash,
                    analysis_result=json.dumps(file_create.analysis_result),
                    file_type=file_create.file_type,
                )
                self.db.add(db_file)
                self.db.commit()
            except IntegrityError:
                self.db.rollback()

    def upload_file(self, filename: str, file_content: bytes, content_type: str) -> dict | str:
        """Upload a file to VirusTotal. If the file hash already exists in DB, return the cached result."""
        file_hash = self._compute_hash(file_content)
        file_type = self.check_file_type(filename=filename, file_content=file_content)

        # Check if analysis result already exists in DB
        existing = self._get_existing(file_hash)
        if existing:
            self._save_to_db(FileCreate(file_hash=file_hash, analysis_result=existing, file_type=file_type))
            return {"cached": True, "file_hash": file_hash, "analysis_result": existing}

        # Not in DB — upload to VirusTotal
        url = f"{self.base_url}/files"
        files = {"file": (filename, file_content, content_type)}

        response = requests.post(url, headers=self.headers, files=files)

        if response.status_code == 200:
            analysis_id = response.json()["data"]["id"]
            # Save file_type immediately because if we wait for GET /vt-report/ later, there will be no filename
            self._save_to_db(FileCreate(file_hash=file_hash, analysis_result={"_pending": True}, file_type=file_type))
            return analysis_id
        elif response.status_code == 409:
            # File already known to VT — fetch existing report by hash instead
            return self.get_report_by_hash(file_hash, file_type=file_type)
        else:
            return {"error": f"Failed to upload file: {response.status_code} - {response.text}"}

    def get_analysis_result(self, analysis_id: str) -> dict:
        """Fetch the analysis result by analysis ID."""
        url = f"{self.base_url}/analyses/{analysis_id}"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()["meta"]["file_info"]["sha256"]
        else:
            return {"error": f"Failed to retrieve analysis result: {response.status_code} - {response.text}"}

    def get_report_by_hash(self, file_hash: str, file_type: str | None = None) -> dict:
        url = f"{self.base_url}/files/{file_hash}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            result = response.json()
            self._save_to_db(FileCreate(file_hash=file_hash, analysis_result=result, file_type=file_type))
            return result
        else:
            return {"error": f"Failed to retrieve report: {response.status_code} - {response.text}"}