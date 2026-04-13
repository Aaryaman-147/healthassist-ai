import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "AI Health Assistant",
      }
    });

    // 1. We now expect an ARRAY of messages from the frontend for memory
    const { messages } = await req.json();

    // 2. Refined System Prompt with strict Model Logic & Risk Scoring
    const systemInstruction = `
      You are an advanced AI clinical triage assistant. You must analyze the patient's symptom history and output a structured JSON risk assessment.
      
      CRITICAL LOGIC RULES:
      - You NEVER diagnose. You assess risk and triage.
      - If symptoms indicate a potential life-threatening event (e.g., chest pain, severe bleeding, stroke signs), 'risk_score' MUST be 90-100, and 'urgency_level' MUST be 'CRITICAL'.
      - If clarification is needed to make a safe assessment (e.g., user says "my head hurts" but doesn't say for how long), fill out the 'clarification_needed' field.

      JSON FORMAT REQUIRED: 
      {
        "possible_risk_categories": ["Category 1", "Category 2"],
        "urgency_level": "Low | Moderate | High | CRITICAL",
        "risk_score": 0, // Integer from 1 to 100
        "next_steps": ["Step 1", "Step 2"],
        "clarification_needed": "Ask a follow-up question here if crucial details are missing, otherwise leave empty string",
        "confidence_level": "Low | Medium | High"
      }
    `;

    // 3. Combine the system instruction with the user's chat history
    const apiMessages = [
      { role: "system", content: systemInstruction },
      ...messages // This injects the entire conversation history!
    ];

    const completion = await openai.chat.completions.create({
      model: "openrouter/free", 
      response_format: { type: "json_object" }, 
      max_tokens: 1000, 
      messages: apiMessages
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return NextResponse.json(result);

  } catch (error) {
    console.error("BACKEND CRASH DETECTED:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}