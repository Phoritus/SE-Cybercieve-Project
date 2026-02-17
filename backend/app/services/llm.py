from app.core.config import groq_config

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage


class LLMService:
    def __init__(self):
        self.client = ChatGroq(
        api_key=groq_config.GROQ_API_KEY,
        model="openai/gpt-oss-120b",
        temperature=0.7,
        model_kwargs={"stream": False}
        )

    def filter_json(self, json_data: dict) -> dict:
        attr = json_data.get("data", {}).get("attributes", {})

        stats = attr.get("last_analysis_stats", {}) or {}
        results = attr.get("last_analysis_results", {}) or {}
        tags = attr.get("tags", []) or []
        names = attr.get("names", []) or []

        # safely calculate total number of engines
        total_engines = sum(stats.values()) if isinstance(stats, dict) else None

        # extract threat labels from engines that report malicious/suspicious
        threat_labels = []
        malicious_engines = []

        for engine, detail in results.items():
            if not isinstance(detail, dict):
                continue

            category = detail.get("category")
            result = detail.get("result")

            if category in ["malicious", "suspicious"] and result:
                threat_labels.append(result)
                malicious_engines.append(engine)

        # unique labels (deduplicated)
        threat_labels = sorted(list(set(threat_labels)))

        # check overlay only if tag exists
        has_overlay = "overlay" in tags

        # structural data (generic extraction)
        structural_risks = {
            "has_overlay": has_overlay,
            "high_entropy_sections": [],
            "suspicious_indicators": []
        }

        # PE entropy (if available)
        pe = attr.get("pe_info", {}) or {}
        sections = pe.get("sections", []) or []

        if isinstance(sections, list):
            structural_risks["high_entropy_sections"] = [
                s.get("name")
                for s in sections
                if isinstance(s, dict)
                and s.get("entropy") is not None
                and s.get("entropy") > 7.0
            ]

        # universal indicators (tags are very useful)
        suspicious_tags = [
            "packed", "obfuscated", "macros", "encrypted",
            "dropper", "trojan", "ransomware", "phishing",
            "shellcode", "keylogger"
        ]

        for t in tags:
            if t in suspicious_tags:
                structural_risks["suspicious_indicators"].append(t)

        # clean output
        clean_data = {
            "file_metadata": {
                "magic": attr.get("magic"),
                "size": attr.get("size"),
                "sha256": attr.get("sha256"),
                "reputation": attr.get("reputation")
            },

            "scan_summary": {
                "malicious": stats.get("malicious"),
                "suspicious": stats.get("suspicious"),
                "harmless": stats.get("harmless"),
                "undetected": stats.get("undetected"),
                "timeout": stats.get("timeout"),
                "confirmed_timeout": stats.get("confirmed-timeout"),
                "failure": stats.get("failure"),
                "type_unsupported": stats.get("type-unsupported"),
                "total_engines": total_engines
            },

            "detections": {
                "threat_labels": threat_labels,
                "flagged_engines": malicious_engines[:30]  # limit number of engines
            },

            "context": {
                "tags": tags[:50],
                "popular_threat_classification": attr.get("popular_threat_classification"),
                "crowdsourced_context": {
                    "votes": attr.get("total_votes"),
                    "comments": attr.get("crowdsourced_yara_results")
                }
            },

            "structural_risks": structural_risks
        }

        return clean_data

    def get_response(self, json_data: str) -> str:
        
        json_data = self.filter_json(json_data)    
        prompt = f"""
        Act as a Cybersecurity Analyst.
        You are given a sandbox JSON report.
        Extract **ONLY** information explicitly present in the input and return the result **as Markdown**.
        STRICT RULES:
        1. Do NOT infer or add information
        2. Guidance must be generic and abstract.
        ---
        Based on the given malware or security detection report, provide basic initial guidance for handling the threat.
        Requirements:
        1. Keep the answer short and simple
        2. Use clear bullet points
        3. Write in clear English

        INPUT JSON:
        {json_data}
        """
        messages = [
        SystemMessage(content="You are a helpful and precise assistant for cybersecurity analysis."),
        HumanMessage(content=prompt)
        ]
        
        response = self.client.invoke(messages)
        return response.content.strip()

# if __name__ == "__main__":
#   llm_service = LLMService()
#   sample_json = {
#     "data": {
#       "attributes": {
#         "magic": "JPEG image data, JFIF standard 1.01, resolution (DPI), density 96x96, segment length 16, baseline, precision 8, 910x681, components 3",
#         "size": 381728,
#         "sha256": "52303a551b8288cf94d0956467333ae2e9c91c5ddf771666be37dac60af56936",
#         "reputation": 0,
#         "last_analysis_stats": {
#           "malicious": 0,
#           "suspicious": 0,
#           "harmless": 0,
#           "undetected": 49,
#           "timeout": 4,
#           "confirmed-timeout": 0,
#           "failure": 8,
#           "type-unsupported": 15
#         },
#         "last_analysis_results": {},
#         "tags": ["jpeg"],
#         "names": [],
#         "popular_threat_classification": None,
#         "total_votes": {"harmless": 0, "malicious": 0},
#         "crowdsourced_yara_results": None
#       }
#     }
#   }
#   print(llm_service.get_response(sample_json))