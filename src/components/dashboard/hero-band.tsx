"use client";

import React, { useEffect, useState, useRef } from "react";
import { ClaudeMark } from "@/components/ui/claude-mark";
import { formatCurrency } from "@/lib/utils";
import { Sparkles, MessageSquare, BarChart3 } from "lucide-react";

interface HeroBandProps {
  revenue: number;
  changePct: number;
  onOpenChat: () => void;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    startRef.current = null;

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

const INSIGHTS_TICKER = [
  "Revenue velocity up 12% week-over-week · Thursday is your strongest day",
  "Average order value trending positive · Upsell opportunities detected",
  "AI has analyzed 522 transactions across your 90-day history",
  "Top category driving 34% of total revenue · Consider expanding inventory",
  "Weekend conversion gap: 3.2× lower than weekday · Untapped potential",
];

export function HeroBand({ revenue, changePct, onOpenChat }: HeroBandProps) {
  const animatedRevenue = useCountUp(revenue);
  const isUp = changePct >= 0;
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);

  // Cycle ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIdx((prev) => (prev + 1) % INSIGHTS_TICKER.length);
        setTickerVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#181715] border border-[#252320]">
      {/* Radial coral gradient mesh background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 85% 50%, #cc785c22 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 15% 20%, #5db8a620 0%, transparent 60%)",
        }}
      />
      {/* Fine grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#faf9f5 1px, transparent 1px), linear-gradient(90deg, #faf9f5 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 px-8 py-10 md:px-12 md:py-14">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left: Editorial Hero Number */}
          <div className="flex-1">
            {/* Mark + Label */}
            <div className="flex items-center gap-2.5 mb-6">
              <ClaudeMark className="h-5 w-5 text-[#cc785c]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#6c6a64]">
                Sales Intelligence Platform
              </span>
            </div>

            {/* Giant number */}
            <div className="flex items-start gap-3 mb-2">
              <span className="font-serif text-[#a09d96] text-3xl leading-none mt-3">$</span>
              <span
                className="font-serif text-[#faf9f5] leading-none"
                style={{
                  fontSize: "clamp(3.5rem, 10vw, 7rem)",
                  letterSpacing: "-0.04em",
                  fontWeight: 400,
                }}
              >
                {animatedRevenue.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
            <p className="text-sm text-[#6c6a64] font-mono mb-4">
              Weekly Revenue · This 7-Day Cycle
            </p>

            {/* Change badge */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-mono border ${
                  isUp
                    ? "bg-[#5db872]/10 border-[#5db872]/30 text-[#5db872]"
                    : "bg-[#c64545]/10 border-[#c64545]/30 text-[#c64545]"
                }`}
              >
                <span className="text-base leading-none">{isUp ? "↑" : "↓"}</span>
                {isUp ? "+" : ""}{changePct.toFixed(1)}% week-over-week
              </div>
              <span className="text-[11px] text-[#6c6a64] font-mono">
                vs previous 7-day period
              </span>
            </div>
          </div>

          {/* Right: Action panel */}
          <div className="flex flex-col gap-3 lg:w-64">
            {/* AI Ticker */}
            <div className="rounded-xl bg-[#252320] border border-[#3d3d3a] p-4 min-h-[80px] flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5db872] animate-pulse" />
                <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#5db872]">
                  AI Live Feed
                </span>
              </div>
              <p
                className="text-xs text-[#a09d96] leading-relaxed transition-opacity duration-400"
                style={{ opacity: tickerVisible ? 1 : 0 }}
              >
                {INSIGHTS_TICKER[tickerIdx]}
              </p>
            </div>

            {/* CTA buttons */}
            <button
              onClick={onOpenChat}
              className="flex items-center justify-between gap-2 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white px-4 py-3.5 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Ask Your Data</span>
              </div>
              <Sparkles className="h-3.5 w-3.5 opacity-70 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="flex gap-2">
              <div className="flex-1 rounded-lg border border-[#3d3d3a] bg-[#252320] px-3 py-2.5 text-center">
                <p className="text-[10px] font-mono text-[#6c6a64] mb-0.5">Data Points</p>
                <p className="text-sm font-serif text-[#faf9f5]">522+</p>
              </div>
              <div className="flex-1 rounded-lg border border-[#3d3d3a] bg-[#252320] px-3 py-2.5 text-center">
                <p className="text-[10px] font-mono text-[#6c6a64] mb-0.5">AI Insights</p>
                <p className="text-sm font-serif text-[#faf9f5]">Live</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ticker strip */}
      <div className="relative z-10 border-t border-[#252320] bg-[#141413]/60 backdrop-blur-sm px-8 py-2.5 flex items-center gap-6 overflow-hidden">
        <BarChart3 className="h-3.5 w-3.5 text-[#cc785c] flex-shrink-0" />
        <div className="flex gap-8 text-[10px] font-mono text-[#6c6a64] whitespace-nowrap overflow-hidden">
          <span>
            <span className="text-[#a09d96]">PLATFORM</span> Sales Intelligence v2.0
          </span>
          <span>
            <span className="text-[#a09d96]">DB</span> Neon PostgreSQL · London
          </span>
          <span>
            <span className="text-[#a09d96]">AI</span> Real-Time Intelligence Engine
          </span>
          <span>
            <span className="text-[#a09d96]">STATUS</span>{" "}
            <span className="text-[#5db872]">● Live</span>
          </span>
        </div>
      </div>
    </div>
  );
}

