import hashlib
import json
from typing import Protocol
import requests
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import virus_total_config
from app.db.supabase import File as DBFile
from app.models.files_model import FileCreate


# Helper Function to decouple validation logic from the Proxy
def is_valid_vt_report(result: dict) -> bool:
    """Return True only if the report contains real (non-zero) analysis stats."""
    stat_keys = ["malicious", "suspicious", "undetected", "harmless", "timeout", "type-unsupported", "failure"]
    stats = (result.get("data", {}) or {}).get("attributes", {}).get("last_analysis_stats", {})
    if not stats:
        return False
    return sum(stats.get(k, 0) for k in stat_keys) > 0

# Define the Protocol (Interface) for report retrieval
class VirusTotalReportProvider(Protocol):
    """Interface (Protocol) defining the contract for report retrieval."""
    def get_report_by_hash(self, file_hash: str) -> dict:
        pass

# Real Subject: Direct API client implementation
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

# Proxy: Implements the same interface and adds caching logic
class VirusTotalCacheProxy:
    """Proxy: checks local cache before delegating to the real API client."""
    
    def __init__(self, db: Session | None, provider: VirusTotalReportProvider):
        self.db = db
        self.provider = provider

    def _get_existing(self, file_hash: str) -> dict | None:
        """Check the database for cached analysis results."""
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
            
            # Reject empty results or results still in pending state
            if isinstance(result, dict) and (not result or result.get("_pending")):
                return None
            
            # Use helper function to validate cached stats
            if not is_valid_vt_report(result):
                return None
            return result
        return None

    def _save_analysis_result(self, file_hash: str, analysis_result: dict, file_type: str | None = None) -> None:
        """Private method: Proxy handles its own persistence logic."""
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
        """Implementation of the interface method with caching logic."""
        existing = self._get_existing(file_hash)
        if existing:
            return existing
        
        # If not in cache, fetch from the real provider
        result = self.provider.get_report_by_hash(file_hash)
        if result and not result.get("error"):
            file_type = result.get("data", {}).get("attributes", {}).get("type_extension")
            # Proxy automatically saves fresh API data without Client intervention
            self._save_analysis_result(file_hash=file_hash, analysis_result=result, file_type=file_type)
        return result

# Client: Uses the provider via the common interface.
class VirusTotalService:
    """Client: Uses the provider via the common interface."""
    def __init__(self, db: Session):
        self.db = db
        self.api_key = virus_total_config.VIRUS_TOTAL_API_KEY
        self.base_url = "https://www.virustotal.com/api/v3"
        self.headers = {
            "accept": "application/json",
            "x-apikey": self.api_key,
        }
        
        # Strictly define type as the Interface (Protocol)
        # This allows switching between Proxy and Real Client seamlessly
        self.report_provider: VirusTotalReportProvider = VirusTotalCacheProxy(
            db=self.db,
            provider=VirusTotalApiClient(base_url=self.base_url, headers=self.headers),
        )

    def _compute_hash(self, file_content: bytes) -> str:
        """Compute SHA-256 hash of file content."""
        return hashlib.sha256(file_content).hexdigest()

    def _mark_as_pending(self, file_hash: str):
        """Service manages the 'Pending' state within its own DB context."""
        db_file = self.db.query(DBFile).filter(DBFile.file_hash == file_hash).first()
        if db_file:
            db_file.analysis_result = json.dumps({"_pending": True})
            self.db.commit()
        else:
            try:
                db_file = DBFile(file_hash=file_hash, analysis_result=json.dumps({"_pending": True}))
                self.db.add(db_file)
                self.db.commit()
            except IntegrityError:
                self.db.rollback()

    def upload_file(self, filename: str, file_content: bytes, content_type: str) -> dict | str:
        """Upload a file. Uses the provider interface to check for existing reports first."""
        file_hash = self._compute_hash(file_content)

        # Interacts through Interface; transparently handles Cache vs API
        vt_existing = self.report_provider.get_report_by_hash(file_hash)
        if vt_existing and not vt_existing.get("error") and is_valid_vt_report(vt_existing):
            return {"cached": True, "file_hash": file_hash, "analysis_result": vt_existing}

        # Perform the actual upload if no valid report exists
        url = f"{self.base_url}/files"
        files = {"file": (filename, file_content, content_type)}
        response = requests.post(url, headers=self.headers, files=files)
        
        if response.status_code == 200:
            analysis_id = response.json()["data"]["id"]
            # Service records its own pending state
            self._mark_as_pending(file_hash)
            return analysis_id
        elif response.status_code == 409:
            # File already exists on VT, attempt to get report
            return self.get_report_by_hash(file_hash)
        else:
            return {"error": f"Failed to upload file: {response.status_code} - {response.text}"}

    def get_analysis_result(self, analysis_id: str, file_hash: str | None = None) -> dict:
        """Fetch analysis status and result."""
        url = f"{self.base_url}/analyses/{analysis_id}"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            data = response.json()
            attrs = data["data"]["attributes"]
            status = attrs["status"]

            if status != "completed":
                if file_hash:
                    # Leverage the Interface! Proxy handles cache lookups/API calls/saving internally.
                    report = self.report_provider.get_report_by_hash(file_hash)
                    if report and not report.get("error") and is_valid_vt_report(report):
                        return {"status": "completed", "sha256": file_hash, "report": report}
                return {"status": status}
            else:
                sha256 = data.get("meta", {}).get("file_info", {}).get("sha256", "")
                if sha256:
                    report = self.get_report_by_hash(sha256)
                    if report and not report.get("error"):
                        return {"status": status, "sha256": sha256, "report": report}
                return {"status": status, "sha256": sha256}
        else:
            return {"error": f"Failed to retrieve report: {response.status_code} - {response.text}"}

    def get_report_by_hash(self, file_hash: str) -> dict:
        """Client uses the report provider without knowing if it's the Proxy or Real Client."""
        return self.report_provider.get_report_by_hash(file_hash)