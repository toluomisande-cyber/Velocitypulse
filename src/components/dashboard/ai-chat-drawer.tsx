"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, Loader2, MessageSquare, ChevronRight } from "lucide-react";
import { ClaudeMark } from "@/components/ui/claude-mark";

interface Message {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "What drove the most revenue this week?",
  "Which category is underperforming?",
  "What day of week has highest sales?",
  "How is my AOV trending?",
];

export function AIChatDrawer({ isOpen, onClose }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Hello. I'm your AI sales analyst. Ask me anything about your business data — revenue trends, category performance, anomalies, or forecasts.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: json.answer ?? "I couldn't generate a response.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "An error occurred. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#141413]/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#181715] border-l border-[#252320] z-50 flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#252320]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/20">
              <ClaudeMark className="h-4 w-4 text-[#cc785c]" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#6c6a64]">
                AI Assistant
              </p>
              <h3 className="font-serif text-base font-normal text-[#faf9f5]">
                Ask Your Data
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md border border-[#3d3d3a] bg-[#252320] text-[#6c6a64] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick prompts */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-[#252320] no-scrollbar">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="flex-shrink-0 text-[11px] font-mono bg-[#252320] border border-[#3d3d3a] text-[#a09d96] hover:text-[#faf9f5] hover:border-[#cc785c]/40 rounded-full px-3 py-1.5 transition-all whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "ai" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#cc785c]/15 border border-[#cc785c]/20 flex items-center justify-center mt-0.5">
                  <ClaudeMark className="h-3.5 w-3.5 text-[#cc785c]" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-[#cc785c] text-white"
                    : "bg-[#252320] border border-[#3d3d3a] text-[#faf9f5]"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p
                  suppressHydrationWarning
                  className={`text-[10px] mt-1.5 font-mono ${
                    msg.role === "user" ? "text-white/60" : "text-[#6c6a64]"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#cc785c]/15 border border-[#cc785c]/20 flex items-center justify-center">
                <ClaudeMark className="h-3.5 w-3.5 text-[#cc785c]" />
              </div>
              <div className="bg-[#252320] border border-[#3d3d3a] rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 text-[#cc785c] animate-spin" />
                <span className="text-xs text-[#6c6a64] font-mono">Analyzing data…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-[#252320]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your sales…"
              className="flex-1 bg-[#252320] border border-[#3d3d3a] rounded-lg px-4 py-2.5 text-sm text-[#faf9f5] placeholder:text-[#6c6a64] focus:outline-none focus:border-[#cc785c]/60 focus:ring-1 focus:ring-[#cc785c]/30 transition-all"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#cc785c] text-white hover:bg-[#a9583e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="text-[10px] text-[#6c6a64] font-mono mt-2 text-center">
            Grounded in live transactional ledgers · Executive AI Copilot
          </p>
        </div>
      </div>
    </>
  );
}

