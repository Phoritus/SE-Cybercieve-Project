import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.supabase import get_db, File as DBFile

router = APIRouter()
STAT_KEYS = ["malicious", "suspicious", "undetected", "harmless", "timeout", "type-unsupported", "failure"]

def _parse_analysis(raw) -> dict | None:
    """Parse analysis_result column into a dict, return None on failure."""
    if raw is None:
        return None
    if isinstance(raw, str):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None
    return raw

def _is_valid(result: dict) -> bool:
    """Return True if the result has real analysis stats (not pending)."""
    if not isinstance(result, dict):
        return False
    if result.get("_pending"):
        return False
    stats = (result.get("data") or {}).get("attributes", {}).get("last_analysis_stats", {})
    if not stats:
        return False
    return sum(stats.get(k, 0) for k in STAT_KEYS) > 0

def _is_malicious(result: dict) -> bool:
    """Return True if the file was flagged as malicious or suspicious."""
    stats = (result.get("data") or {}).get("attributes", {}).get("last_analysis_stats", {})
    return (stats.get("malicious", 0) + stats.get("suspicious", 0)) > 0


@router.get("/stats")
def get_file_statistics(db: Session = Depends(get_db)):
    """Return aggregated file scan statistics grouped by file_type."""
    all_files = db.query(DBFile).all()

    # Aggregate per file_type
    type_stats: dict[str, dict] = {}
    total_scanned = 0
    total_detected = 0

    for f in all_files:
        result = _parse_analysis(f.analysis_result)
        if result is None or not _is_valid(result):
            continue
        file_type = (f.file_type or "unknown").lower()
        total_scanned += 1
        if file_type not in type_stats:
            type_stats[file_type] = {"total": 0, "detected": 0}
        type_stats[file_type]["total"] += 1
        if _is_malicious(result):
            type_stats[file_type]["detected"] += 1
            total_detected += 1

    # Build per-type breakdown
    file_types = []
    for ft, counts in sorted(type_stats.items(), key=lambda x: x[1]["total"], reverse=True):
        pct = round((counts["detected"] / counts["total"]) * 100, 1) if counts["total"] > 0 else 0
        file_types.append({
            "file_type": ft,
            "total_scanned": counts["total"],
            "detected_count": counts["detected"],
            "detected_percentage": pct,
        })

    # Find highest risk type (only consider types with at least 2 files to avoid noise)
    highest_risk = ""
    highest_risk_pct = 0
    for ft in file_types:
        # Skip malformed file_type entries (e.g. ones containing dots or dashes)
        if '.' in ft["file_type"] or '-' in ft["file_type"]:
            continue
        if ft["total_scanned"] < 2:
            continue
        if ft["detected_percentage"] > highest_risk_pct:
            highest_risk_pct = ft["detected_percentage"]
            highest_risk = ft["file_type"]
    detection_rate = round((total_detected / total_scanned) * 100, 1) if total_scanned > 0 else 0

    # Filter out malformed entries from the output
    clean_file_types = [ft for ft in file_types if '.' not in ft["file_type"] and '-' not in ft["file_type"]]

    return {
        "total_files_scanned": total_scanned,
        "detection_rate": detection_rate,
        "highest_risk_type": f".{highest_risk.upper()}" if highest_risk else "N/A",
        "file_types": clean_file_types,
    }
