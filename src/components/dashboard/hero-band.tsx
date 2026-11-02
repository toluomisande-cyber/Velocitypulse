"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { ClaudeMark } from "@/components/ui/claude-mark";
import { KPISummary } from "@/lib/analytics";
import { MessageSquare, UploadCloud, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface HeroBandProps {
  revenue: number;
  changePct: number;
  onOpenChat: () => void;
  onOpenImport?: () => void;
  kpis?: KPISummary | null;
  totalTransactions?: number;
}

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    startRef.current = null;

    const step = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Gentle cubic ease-out
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

export function HeroBand({
  revenue,
  changePct,
  onOpenChat,
  onOpenImport,
  kpis,
  totalTransactions = 0,
}: HeroBandProps) {
  const animatedRevenue = useCountUp(revenue);
  const isUp = changePct >= 0;
  const [tickerIdx, setTickerIdx] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);

  const hasPreviousRevenue = (kpis?.previousWeekRevenue ?? 0) > 0;
  const isZeroState = totalTransactions === 0;

  // Real data-driven signal messages
  const tickerItems = useMemo(() => {
    if (isZeroState) {
      return [
        "Awaiting sales import — upload a CSV to activate weekly revenue metrics",
        "Tenant isolation active — only your uploaded transactions are calculated",
        "Record sales manually or import multiple batches anytime",
      ];
    }

    const items: string[] = [];

    if (kpis) {
      const prevRev = kpis.previousWeekRevenue;
      if (hasPreviousRevenue) {
        items.push(
          `Weekly revenue ${isUp ? "up +" : "down "}${Math.abs(changePct).toFixed(1)}% ($${Math.round(revenue).toLocaleString()} vs $${Math.round(prevRev).toLocaleString()} prior cycle)`
        );
      } else {
        items.push(
          `Initial weekly revenue: $${Math.round(revenue).toLocaleString()} across ${kpis.currentWeekUnits} transactions`
        );
      }

      items.push(
        `Average order value at $${kpis.currentWeekAOV.toFixed(2)} (${kpis.aovChangePct >= 0 ? "+" : ""}${kpis.aovChangePct.toFixed(1)}% vs prior)`
      );

      items.push(
        `Month-to-date pace: $${Math.round(kpis.monthRevenueSoFar).toLocaleString()} · Run rate projected at $${Math.round(kpis.projectedMonthRunRate).toLocaleString()}`
      );
    }

    if (totalTransactions > 0) {
      items.push(
        `${totalTransactions.toLocaleString()} transactions recorded in ledger`
      );
    }

    return items;
  }, [revenue, changePct, isUp, kpis, totalTransactions, hasPreviousRevenue, isZeroState]);

  useEffect(() => {
    if (tickerItems.length <= 1) return;
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIdx((prev) => (prev + 1) % tickerItems.length);
        setTickerVisible(true);
      }, 300);
    }, 6000);
    return () => clearInterval(interval);
  }, [tickerItems]);

  return (
    <div className="rounded-2xl bg-[#151413] border border-[#272522] overflow-hidden text-[#efe9de]">
      <div className="p-8 md:p-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Left: Headline Revenue Figure */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <ClaudeMark className="h-4 w-4 text-[#c26a50]" />
              <span className="text-xs font-mono text-[#8a847a]">
                Weekly revenue velocity
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl md:text-4xl text-[#8a847a] leading-none">$</span>
              <span
                className="font-serif text-[#efe9de] leading-none tracking-tight"
                style={{
                  fontSize: "clamp(3.5rem, 8vw, 5.5rem)",
                  fontWeight: 400,
                }}
              >
                {animatedRevenue.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {hasPreviousRevenue ? (
                <div
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono border ${
                    isUp
                      ? "bg-[#2e7d52]/15 border-[#2e7d52]/30 text-[#4cc38a]"
                      : "bg-[#b33a3a]/15 border-[#b33a3a]/30 text-[#e5484d]"
                  }`}
                >
                  {isUp ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {isUp ? "+" : ""}{changePct.toFixed(1)}% vs prior 7 days
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-mono border border-[#3a3733] bg-[#201e1b] text-[#8a847a]">
                  {isZeroState ? "Awaiting data" : "Initial baseline period"}
                </div>
              )}
              <span className="text-xs text-[#8a847a]">
                Current 7-day rolling window
              </span>
            </div>
          </div>

          {/* Right: Signal ticker & fast actions */}
          <div className="flex flex-col gap-3 lg:w-80">
            {/* Velocity Signals */}
            <div className="rounded-xl bg-[#1e1c19] border border-[#2e2b27] p-4 min-h-[84px] flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4cc38a]" />
                <span className="text-[11px] font-mono text-[#8a847a]">
                  Signals
                </span>
              </div>
              <p
                className="text-xs text-[#aaa398] leading-relaxed transition-opacity duration-200"
                style={{ opacity: tickerVisible ? 1 : 0 }}
              >
                {tickerItems[tickerIdx] || tickerItems[0]}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={onOpenChat}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#c26a50] hover:bg-[#a85840] text-white px-4 py-2.5 text-xs font-medium transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Query assistant
              </button>

              {isZeroState && onOpenImport && (
                <button
                  onClick={onOpenImport}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#3a3733] bg-[#1e1c19] hover:bg-[#262421] text-[#efe9de] px-3.5 py-2.5 text-xs font-medium transition-colors"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-[#c26a50]" />
                  Import CSV
                </button>
              )}
            </div>

            {/* Counts */}
            <div className="flex items-center justify-between text-xs font-mono text-[#8a847a] px-1 pt-1">
              <span>{totalTransactions.toLocaleString()} total transactions</span>
              <span className="text-[#4cc38a]">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
