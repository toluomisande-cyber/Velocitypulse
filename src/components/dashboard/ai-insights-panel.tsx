"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle, Zap, Info, RefreshCw } from "lucide-react";

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
    badge: "text-[#16a34a] bg-[#16a34a]/10",
    label: "Growth",
  },
  warning: {
    icon: AlertTriangle,
    badge: "text-[#b45309] bg-[#b45309]/10",
    label: "Watch",
  },
  neutral: {
    icon: Info,
    badge: "text-[#0284c7] bg-[#0284c7]/10",
    label: "Note",
  },
  action: {
    icon: Zap,
    badge: "text-[#c26a50] bg-[#c26a50]/10",
    label: "Opportunity",
  },
};

export function AIInsightsPanel({ className = "" }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/ai/insights");
      const json = await res.json();
      setInsights(json.insights ?? []);
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

  return (
    <div className={`rounded-xl border border-[#e5e1d8] bg-white overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede6]">
        <div>
          <p className="text-[11px] font-medium text-[#7b7266]">Automated diagnostic</p>
          <h3 className="font-serif text-lg font-normal text-[#1f1b16]">
            Weekly insights digest
          </h3>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="p-1.5 rounded-md text-[#7b7266] hover:text-[#1f1b16] hover:bg-[#faf9f5] transition-colors"
          title="Refresh insights"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#c26a50]" : ""}`} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 divide-y divide-[#f0ede6]">
        {loading ? (
          <div className="space-y-4 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2 pt-3 first:pt-0">
                <div className="h-3.5 w-48 bg-[#efe9df] rounded" />
                <div className="h-3 w-full bg-[#efe9df] rounded" />
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-xs text-[#5e554a]">No anomalies or observations</p>
            <p className="text-[11px] text-[#7b7266]">Import additional sales records to generate pattern insights.</p>
          </div>
        ) : (
          insights.map((item, idx) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.neutral;
            return (
              <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${config.badge}`}>
                    {config.label}
                  </span>
                  <p className="text-xs font-medium text-[#1f1b16]">{item.headline}</p>
                </div>
                <p className="text-xs text-[#5e554a] leading-relaxed pl-1">{item.body}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
