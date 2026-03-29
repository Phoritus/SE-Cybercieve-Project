from app.services.files_manage import VirusTotalService
from app.db.supabase import get_db

from fastapi import UploadFile, File, APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/upload-to-vt")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if file.size and file.size > 50 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File is too large. Maximum allowed size is 50 MB.")

    file_content = await file.read()
    return VirusTotalService(db).upload_file(file.filename, file_content, file.content_type)

@router.get("/vt-analysis/{analysis_id}")
async def get_analysis_result(
    analysis_id: str,
    file_hash: str = Query(default=None),
    db: Session = Depends(get_db),
):
    return VirusTotalService(db).get_analysis_result(analysis_id, file_hash=file_hash)


@router.get("/vt-report/")
def get_report_by_hash(file_hash: str, db: Session = Depends(get_db)):
    return VirusTotalService(db).get_report_by_hash(file_hash)
