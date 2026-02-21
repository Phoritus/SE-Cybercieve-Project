from app.core.config import virus_total_config
from app.db.supabase import File as DBFile
from app.models.files_model import FileCreate

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import hashlib
import json
import requests


class VirusTotalService:
    def __init__(self, db: Session):
        self.db = db
        self.api_key = virus_total_config.VIRUS_TOTAL_API_KEY
        self.base_url = "https://www.virustotal.com/api/v3"
        self.headers = {
            "accept": "application/json",
            "x-apikey": self.api_key,
        }

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
                    return json.loads(result)
                except json.JSONDecodeError:
                    return None
            return result
        return None

    def _save_to_db(self, file_create: FileCreate) -> None:
        """Save or update an analysis result in the database."""
        db_file = self.db.query(DBFile).filter(DBFile.file_hash == file_create.file_hash).first()
        if db_file:
            db_file.analysis_result = json.dumps(file_create.analysis_result)
            self.db.commit()
        else:
            try:
                db_file = DBFile(file_hash=file_create.file_hash, analysis_result=json.dumps(file_create.analysis_result))
                self.db.add(db_file)
                self.db.commit()
            except IntegrityError:
                self.db.rollback()

    def upload_file(self, filename: str, file_content: bytes, content_type: str) -> dict | str:
        """Upload a file to VirusTotal. If the file hash already exists in DB, return the cached result."""
        file_hash = self._compute_hash(file_content)

        # Check if analysis result already exists in DB
        existing = self._get_existing(file_hash)
        if existing:
            return {"cached": True, "file_hash": file_hash, "analysis_result": existing}

        # Not in DB — upload to VirusTotal
        url = f"{self.base_url}/files"
        files = {"file": (filename, file_content, content_type)}

        response = requests.post(url, headers=self.headers, files=files)

        if response.status_code == 200:
            analysis_url = response.json()["data"]["links"]["self"]
            return analysis_url
        else:
            return {"error": f"Failed to upload file: {response.status_code} - {response.text}"}

    def get_analysis_result(self, url: str) -> dict:
        """Fetch the analysis result from a given URL."""
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"Failed to retrieve analysis result: {response.status_code} - {response.text}"}

    def get_report_by_hash(self, file_hash: str) -> dict:
        url = f"{self.base_url}/files/{file_hash}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            result = response.json()
            # Cache the full report in DB
            self._save_to_db(FileCreate(file_hash=file_hash, analysis_result=result))
            return result
        else:
            return {"error": f"Failed to retrieve report: {response.status_code} - {response.text}"}