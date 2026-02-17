from app.core.config import virus_total_config

from fastapi import UploadFile, File, APIRouter
import requests

router = APIRouter()

@router.post("/upload-to-vt")
async def upload_file(file: UploadFile = File(...)) -> str:
    url = "https://www.virustotal.com/api/v3/files"
    api_key = virus_total_config.VIRUS_TOTAL_API_KEY
    
    file_content = await file.read()  # Read the file content into memory
    files = {
        'file': (file.filename, file_content, file.content_type)
    }
    headers = {
        "accept": "application/json",
        "x-apikey": api_key
    }
    
    response = requests.post(url, headers=headers, files=files)
    
    if response.status_code == 200:
        return response.json()["data"]["links"]["self"]  # Return the analysis URL for tracking
    else:
        return {"error": f"Failed to upload file: {response.status_code} - {response.text}"}

@router.get("/vt-analysis/{url:path}")
def get_analysis_result(url: str) -> dict:
    api_key = virus_total_config.VIRUS_TOTAL_API_KEY
    
    headers = {
        "accept": "application/json",
        "x-apikey": api_key
    }
    
    response = requests.get(url, headers=headers)    
    if response.status_code == 200:
        return response.json()  # Return the full analysis result
    else:
        return {"error": f"Failed to retrieve analysis: {response.status_code} - {response.text}"}

@router.get("/vt-report/")
def get_report_by_hash(file_hash: str) -> dict:
    url = f"https://www.virustotal.com/api/v3/files/{file_hash}"
    api_key = virus_total_config.VIRUS_TOTAL_API_KEY
    
    headers = {
        "accept": "application/json",
        "x-apikey": api_key
    }
    
    response = requests.get(url, headers=headers)    
    if response.status_code == 200:
        return response.json()  # Return the full report for the given hash
    else:
        return {"error": f"Failed to retrieve report: {response.status_code} - {response.text}"}



if __name__ == "__main__":
    data = {
  "data": {
    "type": "analysis",
    "id": "OGJhODJlZWUxZDNiNjc3YTlkZDcwOTYwZTNkMTQxYTc6MTc3MTMzODIxNA==",
    "links": {
      "self": "https://www.virustotal.com/api/v3/analyses/OGJhODJlZWUxZDNiNjc3YTlkZDcwOTYwZTNkMTQxYTc6MTc3MTMzODIxNA=="
    }
  }
}
    # print(get_analysis_result(data["data"]["links"]["self"]))