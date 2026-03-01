import hashlib
import json

import requests
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import virus_total_config
from app.db.supabase import File as DBFile
from app.models.files_model import FileCreate


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
                    result = json.loads(result)
                except json.JSONDecodeError:
                    return None
            # Still no real analysis (just save file_type for later)
            if isinstance(result, dict) and (not result or result.get("_pending")):
                return None
            # Reject cached results with empty/zero analysis stats (stale data)
            stats = (result.get("data", {}) or {}).get("attributes", {}).get("last_analysis_stats", {})
            if stats:
                total = sum(stats.get(k, 0) for k in ["malicious", "suspicious", "undetected", "harmless", "timeout", "type-unsupported", "failure"])
                if total == 0:
                    return None
            return result
        return None

    def _save_to_db(self, file_create: FileCreate) -> None:
        """Save or update an analysis result in the database."""
        db_file = self.db.query(DBFile).filter(DBFile.file_hash == file_create.file_hash).first()
        if db_file:
            db_file.analysis_result = json.dumps(file_create.analysis_result)
            if file_create.file_type:
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

        # Check if analysis result already exists in DB
        existing = self._get_existing(file_hash)
        if existing:
            return {"cached": True, "file_hash": file_hash, "analysis_result": existing}

        # Check if file already known to VT
        vt_existing = self.get_report_by_hash(file_hash)
        if vt_existing and not vt_existing.get("error"):
            self._save_to_db(FileCreate(file_hash=file_hash, analysis_result=vt_existing, file_type=vt_existing.get("type_extension")))
            return {"cached": True, "file_hash": file_hash, "analysis_result": vt_existing}

        # Not in DB — upload to VirusTotal
        url = f"{self.base_url}/files"
        files = {"file": (filename, file_content, content_type)}

        response = requests.post(url, headers=self.headers, files=files)

        if response.status_code == 200:
            analysis_id = response.json()["data"]["id"]
            self._save_to_db(FileCreate(file_hash=file_hash, analysis_result={"_pending": True}, file_type=None))
            return analysis_id
        elif response.status_code == 409:
            # File already known to VT — fetch existing report by hash instead
            return self.get_report_by_hash(file_hash)
        else:
            return {"error": f"Failed to upload file: {response.status_code} - {response.text}"}

    def get_analysis_result(self, analysis_id: str, file_hash: str | None = None) -> dict:
        url = f"{self.base_url}/analyses/{analysis_id}"
        response = requests.get(url, headers=self.headers)
        if response.status_code == 200:
            data = response.json()
            attrs = data["data"]["attributes"]
            status = attrs["status"]

            if status != "completed":
                # /analyses/{id} is slow to update, but /files/{hash} may already
                # have the full report. Check it as a fallback.
                if file_hash:
                    file_url = f"{self.base_url}/files/{file_hash}"
                    file_resp = requests.get(file_url, headers=self.headers)
                    if file_resp.status_code == 200:
                        report = file_resp.json()
                        stats = report.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                        total = sum(stats.get(k, 0) for k in [
                            "malicious", "suspicious", "undetected", "harmless",
                            "timeout", "type-unsupported", "failure"
                        ])
                        # Only accept if engines actually reported (not stale/empty)
                        if total > 0:
                            file_type = report.get("data", {}).get("attributes", {}).get("type_extension")
                            self._save_to_db(FileCreate(file_hash=file_hash, analysis_result=report, file_type=file_type))
                            return {"status": "completed", "sha256": file_hash, "report": report}
                return {"status": status}
            else:
                sha256 = data.get("meta", {}).get("file_info", {}).get("sha256", "")
                # Immediately fetch the full report so frontend doesn't need an extra round-trip
                if sha256:
                    report = self.get_report_by_hash(sha256)
                    if report and not report.get("error"):
                        return {"status": status, "sha256": sha256, "report": report}
                return {"status": status, "sha256": sha256}
        else:
            return {"error": f"Failed to retrieve report: {response.status_code} - {response.text}"}


    def get_report_by_hash(self, file_hash: str) -> dict:
        url = f"{self.base_url}/files/{file_hash}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            result = response.json()
            file_type = result.get("data", {}).get("attributes", {}).get("type_extension")
            self._save_to_db(FileCreate(file_hash=file_hash, analysis_result=result, file_type=file_type))
            return result
        else:
            return {"error": f"Failed to retrieve report: {response.status_code} - {response.text}"}