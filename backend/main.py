from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
import os
import json
from dotenv import load_dotenv

# Security & RAG Imports
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

load_dotenv()

# ==========================================
# 1. INITIALIZE SECURITY
# ==========================================
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

ALLOWED_ORIGINS = [
    "http://localhost:3000", 
    "https://your-app-name.vercel.app" 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS, 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# ==========================================
# 2. RAG KNOWLEDGE BASE
# ==========================================
medical_protocols = [
    Document(page_content="APPENDICITIS PROTOCOL: Symptoms include sharp pain in the lower right abdomen. Next steps MUST include: Go to the ER for an ultrasound, do not eat or drink anything (NPO).", metadata={"topic": "Appendicitis"}),
    Document(page_content="MIGRAINE PROTOCOL: Characterized by throbbing pain on one side of the head. Next steps: Rest in a dark room, stay hydrated.", metadata={"topic": "Migraine"})
]

print("Initializing RAG Vector Database...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_db = Chroma.from_documents(medical_protocols, embeddings)
print("Engine Fully Online & Secured!")

# ==========================================
# 3. OPENAI CLIENT
# ==========================================
client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

@app.get("/")
@limiter.limit("10/minute") 
async def root(request: Request):
    return {"status": "online", "message": "HealthAssist AI Engine is running!"}

# ==========================================
# 4. MASTER API ROUTE (WITH SEMANTIC GUARDRAIL)
# ==========================================
@app.post("/api/chat")
@limiter.limit("5/minute") 
async def chat_endpoint(request: Request, req: ChatRequest):
    
    # Safely extract the latest message
    latest_msg = next((m.content for m in reversed(req.messages) if m.role == "user"), "")
    if not latest_msg.strip():
         raise HTTPException(status_code=400, detail="Empty message received.")

    # RAG Search
    try:
        docs = vector_db.similarity_search(latest_msg, k=1)
        retrieved_context = docs[0].page_content if docs else "No specific protocol found."
    except Exception as e:
        print(f"RAG Error: {e}")
        retrieved_context = "No specific protocol found due to search error."

    # THE SEMANTIC GUARDRAIL (Updated for Natural UX)
    system_instruction = f"""
      You are an advanced AI clinical triage assistant.
      
      CORE DIRECTIVE:
      You MUST ONLY evaluate medical symptoms. 
      - If the user says "hello", "hi", or attempts casual chat, politely greet them and ask how you can help with their health today. Set 'is_medical_query' to false.
      - If they ask about non-medical topics (e.g., coding), politely decline and state you are a medical assistant. Set 'is_medical_query' to false.
      - If they describe medical symptoms, set 'is_medical_query' to true, and fill out the clinical assessment fields.

      CLINICAL PROTOCOL REFERENCE:
      {retrieved_context}

      JSON FORMAT REQUIRED:
      {{
        "is_medical_query": true, // false for greetings/junk data
        "friendly_message": "Put your conversational greeting or polite rejection here.",
        "possible_risk_categories": ["Category 1"],
        "urgency_level": "Low | Moderate | High | CRITICAL",
        "risk_score": 0,
        "next_steps": ["Step 1"],
        "clarification_needed": "",
        "confidence_level": "High"
      }}
    """
    
    api_messages = [{"role": "system", "content": system_instruction}]
    for m in req.messages:
         api_messages.append({"role": m.role, "content": m.content})

    # THE UNKILLABLE WATERFALL ROUTER (April 2026 Free Tier Edition)
    backup_models = [
        "openai/gpt-oss-20b:free",
        "google/gemma-4-31b:free",
        "nvidia/nemotron-3-nano-30b-a3b:free",
        "minimax/minimax-m2.5:free"
    ]

    last_error = ""

    for model_id in backup_models:
        try:
            print(f"Attempting to route to: {model_id}...")
            response = await client.chat.completions.create(
                model=model_id,
                response_format={"type": "json_object"},
                max_tokens=1000,
                messages=api_messages
            )
            
            raw_content = response.choices[0].message.content
            if not raw_content:
                raise ValueError("OpenRouter returned an empty response.")
                
            # BULLETPROOF JSON CLEANER
            raw_content = raw_content.strip()
            if raw_content.startswith("```json"):
                raw_content = raw_content[7:]
            if raw_content.startswith("```"):
                raw_content = raw_content[3:]
            if raw_content.endswith("```"):
                raw_content = raw_content[:-3]
                
            print(f"✅ Successfully routed through {model_id}")
            return json.loads(raw_content.strip())

        except Exception as e:
            last_error = str(e)
            print(f"⚠️ Failed on {model_id}: {last_error}. Falling back...")
            continue 

    # If the loop finishes and ALL models failed
    print(f"🚨 FATAL: All backup models failed. Last error: {last_error}")
    raise HTTPException(status_code=503, detail="All medical AI servers are currently offline or overloaded. Please try again in 60 seconds.")
