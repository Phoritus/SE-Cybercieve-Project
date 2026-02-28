from pydantic import BaseModel, Field

# Map MIME types to file extension (when only content is available, no filename)
# Note: .exe files are often detected as application/octet-stream → .bin
# To get .exe accurately, always send filename or file_path.
MIME_TO_EXT: dict[str, str] = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "text/plain": ".txt",
    "text/html": ".html",
    "text/css": ".css",
    "application/json": ".json",
    "application/zip": ".zip",
    "application/x-tar": ".tar",
    "application/gzip": ".gz",
    "application/x-7z-compressed": ".7z",
    "application/x-rar-compressed": ".rar",
    "application/x-msdownload": ".exe",
    "application/x-msdos-program": ".exe",
    "application/x-executable": ".exe",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
    "application/msword": ".doc",
    "application/vnd.ms-excel": ".xls",
    "application/octet-stream": ".bin",
}


class FileCreate(BaseModel):
    file_hash: str
    analysis_result: dict
    file_type: str | None = None