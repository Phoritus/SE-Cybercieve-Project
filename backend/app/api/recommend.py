from app.services.llm import LLMService

from fastapi import APIRouter, Depends

router = APIRouter()
@router.post("/recommendation")
def get_recommendation(json_data: dict):
    recommendation = LLMService().get_response(json_data)
    return {"recommendation": recommendation}