import hashlib
import json
from typing import Protocol

import requests
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import virus_total_config
from app.db.supabase import File as DBFile
from app.models.files_model import FileCreate


class VirusTotalReportProvider(Protocol):
    def get_report_by_hash(self, file_hash: str) -> dict:
        pass


class VirusTotalApiClient:
    """Real subject: performs direct calls to VirusTotal API."""

    def __init__(self, base_url: str, headers: dict[str, str]):
        self.base_url = base_url
        self.headers = headers

    def get_report_by_hash(self, file_hash: str) -> dict:
        url = f"{self.base_url}/files/{file_hash}"
        response = requests.get(url, headers=self.headers)

        if response.status_code == 200:
            return response.json()
        return {"error": f"Failed to retrieve report: {response.status_code} - {response.text}"}


class VirusTotalCacheProxy:
    """Proxy: checks local cache before delegating to the real API client."""

    STAT_KEYS = ["malicious", "suspicious", "undetected", "harmless", "timeout", "type-unsupported", "failure"]

    @staticmethod
    def _has_valid_stats(result: dict) -> bool:
        """Return True only if the report contains real (non-zero) analysis stats."""
        stats = (result.get("data", {}) or {}).get("attributes", {}).get("last_analysis_stats", {})
        if not stats:
            return False
        total = sum(stats.get(k, 0) for k in VirusTotalCacheProxy.STAT_KEYS)
        return total > 0

    def __init__(self, db: Session | None, provider: VirusTotalReportProvider):
        self.db = db
        self.provider = provider

    def _get_existing(self, file_hash: str) -> dict | None:
        """Check DB for an existing analysis result. Returns the result dict or None."""
        if self.db is None:
            return None

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
            if not self._has_valid_stats(result):
                return None
            return result
        return None

    def save_analysis_result(self, file_hash: str, analysis_result: dict, file_type: str | None = None) -> None:
        """Save or update an analysis result in the database."""
        if self.db is None:
            return

        file_create = FileCreate(file_hash=file_hash, analysis_result=analysis_result, file_type=file_type)
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

    def get_report_by_hash(self, file_hash: str) -> dict:
        existing = self._get_existing(file_hash)
        if existing:
            return existing

        result = self.provider.get_report_by_hash(file_hash)
        if result and not result.get("error"):
            # Persist provider responses; stale/incomplete payloads are filtered on read.
            file_type = result.get("data", {}).get("attributes", {}).get("type_extension")
            self.save_analysis_result(file_hash=file_hash, analysis_result=result, file_type=file_type)
        return result


class VirusTotalService:
    def __init__(self, db: Session):
        self.db = db
        self.api_key = virus_total_config.VIRUS_TOTAL_API_KEY
        self.base_url = "https://www.virustotal.com/api/v3"
        self.headers = {
            "accept": "application/json",
            "x-apikey": self.api_key,
        }

        self.report_proxy = VirusTotalCacheProxy(
            db=self.db,
            provider=VirusTotalApiClient(base_url=self.base_url, headers=self.headers),
        )

    def _compute_hash(self, file_content: bytes) -> str:
        """Compute SHA-256 hash of file content."""
        return hashlib.sha256(file_content).hexdigest()

    def upload_file(self, filename: str, file_content: bytes, content_type: str) -> dict | str:
        """Upload a file to VirusTotal. If the file hash already exists in DB, return the cached result."""
        file_hash = self._compute_hash(file_content)

        # Cache proxy handles local cache lookup and external lookup fallback.
        vt_existing = self.get_report_by_hash(file_hash)
        if vt_existing and not vt_existing.get("error") and VirusTotalCacheProxy._has_valid_stats(vt_existing):
            return {"cached": True, "file_hash": file_hash, "analysis_result": vt_existing}

        # Not in DB — upload to VirusTotal.
        url = f"{self.base_url}/files"

        files = {"file": (filename, file_content, content_type)}

        response = requests.post(url, headers=self.headers, files=files)

        if response.status_code == 200:
            analysis_id = response.json()["data"]["id"]
            self.report_proxy.save_analysis_result(file_hash=file_hash, analysis_result={"_pending": True}, file_type=None)
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
                            self.report_proxy.save_analysis_result(file_hash=file_hash, analysis_result=report, file_type=file_type)
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
        return self.report_proxy.get_report_by_hash(file_hash)