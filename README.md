# HealthAssist AI 🩺

A full-stack AI system for symptom-based risk assessment, combining large language models with retrieval-augmented knowledge grounding and safety guardrails to produce structured, explainable outputs.

## 🧠 Overview

This project explores how AI can support early-stage health risk understanding in a responsible and structured manner.

It integrates LLM reasoning with retrieval-based grounding and system-level safeguards to reduce hallucination and ensure outputs remain within a controlled medical scope.

> _⚠️ This is a prototype for research and development purposes only. It is not a medical diagnosis tool._

## 🏗️ Architecture

This project is split into a modern web frontend and a highly resilient, Python-driven AI engine.

* **🔹 Frontend — Next.js + Tailwind CSS:**
  - Clean, clinical UI with conversational interaction
  - Dynamic rendering of structured risk scorecards
* **Backend (FastAPI):**
  - Asynchronous Python API layer
  - Request validation and structured response formatting
  - Rate limiting and secure API handling
* **Knowledge Base (ChromaDB & HuggingFace):**
  - Retrieval-Augmented Generation (RAG) pipeline
  - Embedding-based retrieval of curated medical references
  - Grounds model responses to reduce hallucination
* **AI Engine (OpenRouter Waterfall):**
  - Multi-model routing via OpenRouter
  - Fallback strategy across multiple instruction-tuned models
  - Ensures robustness under API rate limits and outages
## ✨ Key Features

* **🧠 Structured Risk Assessment:**
  - Risk levels (Low / Medium / High)
  - Confidence estimation
  - Suggested next steps
  - Explainability layer
* **🛡️ Safety & Guardrails:**
  - Restricts non-medical or out-of-scope queries
  - Enforces structured, clinical-style outputs
  - Includes emergency escalation logic
* **🔄 Fault-Tolerant AI Routing:**
  - Detects API failures (e.g., rate limits, downtime)
  - Integrated `slowapi` to prevent bot spam and strict CORS configurations.
  - Automatically switches to backup models
  - Maintains consistent user experience
 
## 🧪 Example Output

Input:
"I’ve had sharp lower back pain for 3 days"

Output:
Risk Level: Moderate  
Confidence: High  
Clinical Risk Score: 45/100

Follow-up needed: None

Identified Risks:
Musculoskeletal, Renal

Recommended Actions:
- Monitor the pain and any accompanying symptoms  
- Stay hydrated and avoid activities that exacerbate the pain  
- Seek medical evaluation if the pain persists beyond a few more days or worsens  

## ⚠️ Limitations

- Not clinically validated or approved for medical use  
- Relies on LLM reasoning, which may produce incorrect or incomplete outputs  
- Knowledge base is limited to curated sources and not exhaustive  
- Does not replace professional medical advice  
 
## 🔮 Future Work

* Multilingual support for broader accessibility
* Voice-based input for low-resource settings
* Integration with validated medical datasets

- Not clinically validated or approved for medical use  
- Relies on LLM reasoning, which may produce incorrect or incomplete outputs  
- Knowledge base is limited to curated sources and not exhaustive  
- Does not replace professional medical advice  
