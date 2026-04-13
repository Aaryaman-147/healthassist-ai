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

* **Semantic Guardrails:** Actively blocks non-medical prompts (e.g., coding requests, casual chat) and forces the AI to stay in character.
* **Unkillable Waterfall Routing:** Automatically catches `429` and `503` errors from overloaded AI APIs and seamlessly routes the request to backup models with zero frontend downtime.
* **Rate Limiting & Security:** Integrated `slowapi` to prevent bot spam and strict CORS configurations.
* **Dynamic UI Rendering:** Intelligently switches between a friendly conversational chat bubble for greetings and a full Clinical Risk Scorecard for symptom triage.
