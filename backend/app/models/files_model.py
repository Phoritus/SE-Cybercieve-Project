from pydantic import BaseModel
class FileCreate(BaseModel):
    file_hash: str
    analysis_result: dict
    file_type: str | None = None