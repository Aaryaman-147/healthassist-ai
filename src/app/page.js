"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      // 1. Strictly format the memory for FastAPI's Pydantic schema
      const formattedHistory = updatedMessages.map(msg => {
        // Pydantic strictly requires a string for 'content'
        let safeContent = "";
        if (msg.role === 'user') {
          safeContent = msg.content;
        } else if (msg.data) {
          safeContent = JSON.stringify(msg.data);
        }
        
        return {
          role: msg.role,
          content: safeContent
        };
      });

      // 2. Send the exact { messages: [...] } payload Python expects
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: formattedHistory }), 
      });

      if (!response.ok) {
        // This will print the EXACT reason FastAPI rejected it to your browser console
        const errorDetails = await response.text();
        console.error("Server Error Details:", errorDetails);
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", data: data }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", error: "Connection error. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyColor = (level) => {
    const l = level?.toLowerCase() || "";
    if (l.includes("critical") || l.includes("high")) return "bg-red-50 text-red-700 border-red-200";
    if (l.includes("moderate")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  };

  // Helper for the new Risk Score Progress Bar
  const getScoreColor = (score) => {
    if (score >= 75) return "bg-red-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <main className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">HealthAssist<span className="text-blue-600">.AI</span></h1>
          </div>
        </div>
      </header>

      <div className="bg-blue-50/50 border-b border-blue-100 py-2 text-center text-xs text-blue-800 font-medium tracking-wide">
        FOR EDUCATIONAL PURPOSES ONLY • CONSULT A MEDICAL PROFESSIONAL FOR DIAGNOSES
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {messages.length === 0 && (
            <div className="text-center mt-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 inline-block max-w-lg">
                <h2 className="text-2xl font-semibold text-slate-800 mb-2">How are you feeling?</h2>
                <p className="text-slate-500 mb-6 text-sm">Describe your symptoms. I will remember our conversation as we narrow down the possibilities.</p>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "user" ? (
                <div className="bg-blue-600 text-white px-6 py-4 rounded-3xl rounded-br-sm max-w-[75%] shadow-md text-[15px]">
                  {msg.content}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 p-6 rounded-3xl rounded-tl-sm w-full max-w-[85%] shadow-sm">
                  {msg.error ? (
                    <p className="text-red-500 text-sm">{msg.error}</p>
                  ) : msg.data.is_medical_query === false ? (
                    
                    /* NEW: Natural Conversational Bubble */
                    <div className="text-slate-700 leading-relaxed">
                      {msg.data.friendly_message || "How can I assist with your health today?"}
                    </div>

                  ) : (
                    
                    /* EXISTING: Full Clinical Scorecard */
                    <div className="space-y-6">
                      {/* Top Bar & New Risk Score UI */}
                      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center justify-between">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${getUrgencyColor(msg.data.urgency_level)}`}>
                            {msg.data.urgency_level || "UNKNOWN"}
                          </span>
                          <div className="text-xs font-medium text-slate-400">
                            Confidence: {msg.data.confidence_level}
                          </div>
                        </div>

                        {/* Visual Risk Score Bar */}
                        {msg.data.risk_score !== undefined && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                              <span>Clinical Risk Score</span>
                              <span>{msg.data.risk_score}/100</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full transition-all duration-1000 ${getScoreColor(msg.data.risk_score)}`} 
                                style={{ width: `${msg.data.risk_score}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Clarification Question */}
                      {msg.data.clarification_needed && msg.data.clarification_needed !== "" && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
                          <p className="text-sm text-blue-900 font-medium">
                            <span className="font-bold">Follow-up needed:</span> {msg.data.clarification_needed}
                          </p>
                        </div>
                      )}

                      <div>
                        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Identified Risks</h3>
                        <div className="flex flex-wrap gap-2">
                          {msg.data.possible_risk_categories?.map((risk, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 px-4 py-1.5 rounded-xl text-sm font-medium border">
                              {risk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide">Recommended Actions</h3>
                        <ul className="space-y-2">
                          {msg.data.next_steps?.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                              <span className="text-blue-500 font-bold mt-0.5">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 px-6 py-5 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
                <span className="ml-2 text-sm font-medium text-slate-500">Evaluating telemetry...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 pb-6">
        <form onSubmit={sendMessage} className="max-w-3xl mx-auto relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your symptoms here..."
            disabled={isLoading}
            className="w-full bg-slate-100 text-slate-800 border border-transparent focus:bg-white focus:border-blue-300 focus:ring-4 focus:ring-blue-100 rounded-2xl pl-6 pr-32 py-4 outline-none transition-all disabled:opacity-50 text-[15px]"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
          >
            Analyze
          </button>
        </form>
      </div>
    </main>
  );
}