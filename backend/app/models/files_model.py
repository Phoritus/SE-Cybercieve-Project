from pydantic import BaseModel, Field

class FileCreate(BaseModel):
    file_id: str
    analysis_result: dict