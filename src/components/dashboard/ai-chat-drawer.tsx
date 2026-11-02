"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, MessageSquare } from "lucide-react";
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
  "What day has highest velocity?",
  "How is my AOV trending?",
];

export function AIChatDrawer({ isOpen, onClose }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Hello. I analyze your live sales transactions. Ask me about weekly revenue, velocity pace, anomalies, or forward projections.",
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
          content: json.answer ?? "I couldn't generate an answer from the database records.",
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Failed to connect to analytics engine. Please retry.",
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
        className={`fixed inset-0 bg-[#191816]/40 backdrop-blur-sm z-40 transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-[#e5e1d8] z-50 flex flex-col transition-transform duration-250 ease-out shadow-xl ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede6]">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#faf9f5] border border-[#e5e1d8]">
              <ClaudeMark className="h-4 w-4 text-[#c26a50]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#7b7266]">
                Analytics copilot
              </p>
              <h3 className="font-serif text-base font-normal text-[#191816]">
                Query assistant
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-md text-[#7b7266] hover:text-[#191816] hover:bg-[#faf9f5] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick prompts */}
        <div className="flex gap-2 px-5 py-3 overflow-x-auto border-b border-[#f0ede6] bg-[#faf9f5]">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="flex-shrink-0 text-xs font-normal bg-white border border-[#e5e1d8] text-[#5e554a] hover:text-[#191816] hover:border-[#c26a50] rounded-md px-2.5 py-1 transition-colors whitespace-nowrap"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "ai" && (
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[#faf9f5] border border-[#e5e1d8] flex items-center justify-center mt-0.5">
                  <ClaudeMark className="h-3 w-3 text-[#c26a50]" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#c26a50] text-white"
                    : "bg-[#faf9f5] border border-[#e5e1d8] text-[#191816]"
                }`}
              >
                <p>{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="flex-shrink-0 w-6 h-6 rounded-md bg-[#faf9f5] border border-[#e5e1d8] flex items-center justify-center mt-0.5">
                <ClaudeMark className="h-3 w-3 text-[#c26a50]" />
              </div>
              <div className="rounded-lg bg-[#faf9f5] border border-[#e5e1d8] px-3.5 py-2.5 text-xs text-[#7b7266] flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#c26a50]" />
                Querying database metrics…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="p-4 border-t border-[#f0ede6] bg-[#faf9f5] flex gap-2"
        >
          <input
            type="text"
            placeholder="Ask about revenue, categories, or trends…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 h-9 rounded-md border border-[#e5e1d8] bg-white px-3 text-xs text-[#191816] placeholder:text-[#7b7266] focus:outline-none focus:border-[#c26a50]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-9 px-3 rounded-md bg-[#c26a50] hover:bg-[#a85840] text-white text-xs font-medium disabled:opacity-40 transition-colors flex items-center justify-center"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </>
  );
}
