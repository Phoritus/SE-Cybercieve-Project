from pydantic import BaseModel, Field

class FileCreate(BaseModel):
    file_hash: str
    analysis_result: dict