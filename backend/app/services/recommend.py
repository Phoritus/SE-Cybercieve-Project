from app.core.config import virus_total_config
from app.services.llm import LLMService

class RecommendationService:
    def __init__(self):
        self.call_llm = LLMService()
    
    def generate_recommendation(self, json_data: dict) -> str:
        recommendation = self.call_llm.get_response(json_data)
        return recommendation