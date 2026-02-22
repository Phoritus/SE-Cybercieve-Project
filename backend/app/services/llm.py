from app.core.config import groq_config

import json
from langchain_groq import ChatGroq

class LLMService:
    def __init__(self):
        self.client = ChatGroq(
            api_key=groq_config.GROQ_API_KEY,
            model="openai/gpt-oss-120b",
            temperature=0.5,
        )

    def filter_json(self, json_data: dict) -> str:
        attributes = json_data.get("data", {}).get("attributes", {})

        # 2. File Info
        name = attributes.get("meaningful_name", "Unknown")
        file_type = attributes.get("type_description", "Unknown")
        file_hash = attributes.get("sha256", "Unknown")

        # 3. Scan Summary
        stats = attributes.get("last_analysis_stats", {})
        malicious_count = stats.get("malicious", 0)
        undetected_count = stats.get("undetected", 0)
        total_engines = sum(stats.values()) if stats else 0
        detection_ratio = f"{(malicious_count / total_engines) * 100:.1f}%" if total_engines > 0 else "0%"

        # 4. Threat Details (malicious engines only)
        threat_details = []
        results = attributes.get("last_analysis_results", {})
        for engine, result_data in results.items():
            if result_data.get("category") == "malicious":
                threat_details.append({
                    "engine": engine,
                    "malware_name": result_data.get("result")
                })

        # 5. Sandbox Analysis
        sandbox_analysis = {}
        sandboxes = attributes.get("sandbox_verdicts", {})
        if sandboxes:
            if "Zenbox" in sandboxes:
                sb_data = sandboxes["Zenbox"]
                sandbox_analysis = {
                    "source": "Zenbox",
                    "verdict": sb_data.get("malware_classification", ["UNKNOWN"])[0],
                    "confidence": sb_data.get("confidence", 0)
                }
            else:
                first_sb = list(sandboxes.keys())[0]
                sandbox_analysis = {
                    "source": first_sb,
                    "verdict": sandboxes[first_sb].get("category", "Unknown")
                }

        # 6. Behavioral Indicators (suspicious imports)
        suspicious_keywords = ["CreateProcess", "IsDebuggerPresent", "SetUnhandledExceptionFilter", "VirtualAlloc"]
        found_suspicious_imports = []

        imports = attributes.get("pe_info", {}).get("import_list", [])
        for lib in imports:
            for func in lib.get("imported_functions", []):
                for keyword in suspicious_keywords:
                    if keyword.lower() in func.lower() and func not in found_suspicious_imports:
                        found_suspicious_imports.append(func)

        # 7. Build filtered JSON for LLM
        filtered_data = {
            "file_info": {
                "file_name": name,
                "file_type": file_type,
                "sha-256": file_hash
            },
            "scan_summary": {
                "malicious_count": malicious_count,
                "total_engines": total_engines,
                "detection_ratio": detection_ratio
            },
            "threat_details": threat_details,
            "sandbox_analysis": sandbox_analysis,
            "behavioral_indicators": {
                "suspicious_imports": found_suspicious_imports
            }
        }

        return json.dumps(filtered_data, indent=4)

    def get_response(self, json_data: str) -> str:
        
        json_data = self.filter_json(json_data)    
        prompt = f"""
        Act as a Cybersecurity Analyst.
        You are given a JSON report containing "file_info", "scan_summary", "threat_details", "sandbox_analysis", and "behavioral_indicators".
        Extract the requested information from the JSON and format it EXACTLY according to the Markdown template below.
        STRICT RULES:
        1. If a value is missing, or if an array/object is empty (e.g., []), output "None detected" or "N/A".
        2. Do not modify the Markdown formatting.
        TASK:
        Fill out the template below. For the "Initial Guidance & Remediation" section, select the correct bullet points based on the "malicious_count" value.
        OUTPUT FORMAT TEMPLATE:
        ## 🛡️ Initial Security Assessment Report

        **📄 File Information**
        * **Name:** [Extract `file_name` from `file_info`]
        * **Type:** [Extract `file_type` from `file_info`]
        * **Hash (SHA-256):** [Extract `sha-256` from `file_info`]

        **🚨 Detection Overview**
        * **Score:** [Extract `malicious_count`] out of [Extract `total_engines`] engines detected this file.
        * **Threat Identifier:** [If `threat_details` has data, list the engine and malware_name. If empty, write "None detected"]
        * **Sandbox Verdict:** [If `sandbox_analysis` has data, list the verdict and confidence. If empty, write "N/A"]

        **⚙️ Behavioral Indicators**
        * **Suspicious Capabilities:** [If `suspicious_imports` has data, list them. If empty, write "None detected"]

        ---
        ### 🛠️ Initial Guidance & Remediation

        [IF `malicious_count` IS 0, OUTPUT ONLY THIS BLOCK:]
        * ✅ **Safe / Benign:** The file has no detections and appears safe.
        * 🔍 **Standard Hygiene:** No immediate action or quarantine required. Proceed with normal handling.

        [IF `malicious_count` IS GREATER THAN 0, OUTPUT ONLY THIS BLOCK:]
        * 🛑 **Isolate:** Temporarily restrict network access for the affected host to prevent potential lateral movement.
        * 🔍 **Verify Source:** Determine if the file was downloaded from a verified, official provider.
        * ⚠️ **Review Execution:** Check system logs for the execution of the identified suspicious capabilities.
        * 🗑️ **Quarantine/Remove:** If the source is unknown or unverified, immediately quarantine or delete the file.
        * ✅ **Monitor:** Continue monitoring the endpoint for anomalous activities or unexpected process spawns.
        INPUT JSON:
        {json_data}
        """
        messages = [
            ("system", "You are a helpful and precise cybersecurity analyst."),
            ("human", prompt)
        ]

        response = self.client.invoke(messages)
        return response.content.strip()

# if __name__ == "__main__":
#   llm_service = LLMService()
#   null = None
#   sample_json =
#   print(llm_service.get_response(sample_json))