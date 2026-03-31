"""Tests for files_manage.VirusTotalService."""
import pytest

from app.services.files_manage import VirusTotalCacheProxy, VirusTotalService


class DummyReportProvider:
    def __init__(self, result: dict):
        self.result = result
        self.calls = 0

    def get_report_by_hash(self, file_hash: str) -> dict:
        self.calls += 1
        return self.result


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


def test_proxy_returns_cached_result_without_calling_provider(monkeypatch):
    provider = DummyReportProvider(result={"error": "should not be called"})
    proxy = VirusTotalCacheProxy(db=None, provider=provider)
    cached_payload = {"data": {"id": "cached-report"}}
    monkeypatch.setattr(proxy, "_get_existing", lambda _file_hash: cached_payload)
    result = proxy.get_report_by_hash("abc123")

    assert result == cached_payload
    assert provider.calls == 0


def test_proxy_fetches_and_saves_on_cache_miss(monkeypatch):
    provider_result = {
        "data": {
            "attributes": {
                "type_extension": "pdf",
            }
        }
    }
    provider = DummyReportProvider(result=provider_result)
    proxy = VirusTotalCacheProxy(db=None, provider=provider)
    saved_payload = {}
    monkeypatch.setattr(proxy, "_get_existing", lambda _file_hash: None)

    def _capture_save(file_hash: str, analysis_result: dict, file_type: str | None = None):
        saved_payload["file_hash"] = file_hash
        saved_payload["analysis_result"] = analysis_result
        saved_payload["file_type"] = file_type

    monkeypatch.setattr(proxy, "save_analysis_result", _capture_save)

    result = proxy.get_report_by_hash("def456")

    assert result == provider_result
    assert provider.calls == 1
    assert saved_payload["file_hash"] == "def456"
    assert saved_payload["analysis_result"] == provider_result
    assert saved_payload["file_type"] == "pdf"
