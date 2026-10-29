"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Zap, Info, RefreshCw } from "lucide-react";
import { ClaudeMark } from "@/components/ui/claude-mark";

interface Insight {
  type: "positive" | "warning" | "neutral" | "action";
  headline: string;
  body: string;
}

interface AIInsightsPanelProps {
  className?: string;
}

const TYPE_CONFIG = {
  positive: {
    icon: TrendingUp,
    accent: "text-[#5db872]",
    bg: "bg-[#5db872]/10 border-[#5db872]/20",
    dot: "bg-[#5db872]",
    label: "GROWTH",
  },
  warning: {
    icon: AlertTriangle,
    accent: "text-[#e8a55a]",
    bg: "bg-[#e8a55a]/10 border-[#e8a55a]/20",
    dot: "bg-[#e8a55a]",
    label: "WATCH",
  },
  neutral: {
    icon: Info,
    accent: "text-[#5db8a6]",
    bg: "bg-[#5db8a6]/10 border-[#5db8a6]/20",
    dot: "bg-[#5db8a6]",
    label: "INSIGHT",
  },
  action: {
    icon: Zap,
    accent: "text-[#cc785c]",
    bg: "bg-[#cc785c]/10 border-[#cc785c]/20",
    dot: "bg-[#cc785c]",
    label: "ACTION",
  },
};

export function AIInsightsPanel({ className = "" }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/ai/insights");
      const json = await res.json();
      setInsights(json.insights ?? []);
      setAiEnabled(json.aiEnabled ?? false);
      setVisibleCount(0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Stagger card appearance
  useEffect(() => {
    if (insights.length === 0) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= insights.length) clearInterval(timer);
    }, 140);
    return () => clearInterval(timer);
  }, [insights]);

  return (
    <div className={`bg-[#181715] rounded-xl border border-[#252320] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#252320]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/20">
            <ClaudeMark className="h-4 w-4 text-[#cc785c]" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#a09d96]">
              AI Intelligence
            </p>
            <h3 className="font-serif text-base font-normal text-[#faf9f5] leading-tight">
              Weekly Business Digest
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!aiEnabled ? (
            <span className="text-[10px] font-mono text-[#a09d96] bg-[#252320] px-2.5 py-0.5 rounded border border-[#3d3d3a] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5db8a6]" />
              INTELLIGENCE ACTIVE
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#5db872]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5db872] animate-pulse" />
              AI REASONING LIVE
            </span>
          )}
          <button
            onClick={load}
            disabled={refreshing}
            className="flex items-center justify-center w-7 h-7 rounded-md border border-[#3d3d3a] bg-[#252320] text-[#6c6a64] hover:text-[#faf9f5] hover:border-[#cc785c]/40 transition-all disabled:opacity-40"
            title="Refresh AI insights"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Insight Cards Grid */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-lg bg-[#252320] border border-[#3d3d3a] animate-pulse"
              />
            ))
          : insights.map((insight, idx) => {
              const cfg = TYPE_CONFIG[insight.type] ?? TYPE_CONFIG.neutral;
              const Icon = cfg.icon;
              const isVisible = idx < visibleCount;

              return (
                <div
                  key={idx}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(12px)",
                    transition: "opacity 0.35s ease, transform 0.35s ease",
                  }}
                  className={`rounded-lg border p-4 ${cfg.bg}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 ${cfg.accent}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`text-[9px] font-mono font-bold uppercase tracking-widest ${cfg.accent}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-[#faf9f5] leading-snug mb-1">
                        {insight.headline}
                      </p>
                      <p className="text-xs text-[#a09d96] leading-relaxed">
                        {insight.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
      </div>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center gap-2">
        <Sparkles className="h-3 w-3 text-[#cc785c]" />
        <p className="text-[10px] text-[#6c6a64] font-mono">
          Automated executive pattern analysis & revenue modeling · Updates continuously
        </p>
      </div>
    </div>
  );
}

