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
def get_analysis_result(analysis_id: str, db: Session = Depends(get_db)):
    return VirusTotalService(db).get_analysis_result(analysis_id)


@router.get("/vt-report/")
def get_report_by_hash(file_hash: str, db: Session = Depends(get_db)):
    return VirusTotalService(db).get_report_by_hash(file_hash)



# if __name__ == "__main__":
#     data = {
#   "data": {
#     "type": "analysis",
#     "id": "OGJhODJlZWUxZDNiNjc3YTlkZDcwOTYwZTNkMTQxYTc6MTc3MTMzODIxNA==",
#     "links": {
#       "self": "https://www.virustotal.com/api/v3/analyses/OGJhODJlZWUxZDNiNjc3YTlkZDcwOTYwZTNkMTQxYTc6MTc3MTMzODIxNA=="
#     }
#   }
# }
#     # print(get_analysis_result(data["data"]["links"]["self"]))