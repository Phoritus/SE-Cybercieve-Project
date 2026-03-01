from app.services.files_manage import VirusTotalService
from app.db.supabase import get_db

from fastapi import UploadFile, File, APIRouter, Depends
from sqlalchemy.orm import Session

router = APIRouter()
@router.post("/upload-to-vt")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_content = await file.read()
    return VirusTotalService(db).upload_file(file.filename, file_content, file.content_type)

@router.get("/vt-analysis/{analysis_id}")
def get_analysis_result(analysis_id: str, file_hash: str | None = None, db: Session = Depends(get_db)):
    return VirusTotalService(db).get_analysis_result(analysis_id, file_hash=file_hash)


@router.get("/vt-report/")
def get_report_by_hash(file_hash: str, db: Session = Depends(get_db)):
    return VirusTotalService(db).get_report_by_hash(file_hash)
