from pydantic import BaseModel

# Define Pydantic models for file operations
class FileCreate(BaseModel):
    file_hash: str
    analysis_result: dict
    file_type: str | None = None