"use client";

import React from "react";
import { KPISummary } from "@/lib/analytics";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, ShoppingCart, Receipt, CalendarCheck2, Clock, UploadCloud,
} from "lucide-react";

interface KPICardsProps {
  kpis: KPISummary | null;
  isLoading?: boolean;
  onOpenImport?: () => void;
}

function SkeletonCard({ dark = false }: { dark?: boolean }) {
  const bg = dark ? "bg-[#252320]" : "bg-[#efe9de]";
  return (
    <div
      className={`rounded-xl border ${
        dark ? "border-[#3d3d3a] bg-[#181715]" : "border-[#e6dfd8] bg-[#faf9f5]"
      } p-6 animate-pulse`}
    >
      <div className={`h-3 w-24 ${bg} rounded mb-5`} />
      <div className={`h-12 w-40 ${bg} rounded mb-3`} />
      <div className={`h-3 w-32 ${bg} rounded`} />
    </div>
  );
}

function DeltaBadge({
  pct,
  hasPreviousPeriod,
  inverse = false,
}: {
  pct: number;
  hasPreviousPeriod: boolean;
  inverse?: boolean;
}) {
  if (!hasPreviousPeriod) {
    return (
      <span className="text-[10px] font-mono text-[#8e8b82] px-2 py-0.5 rounded bg-[#8e8b82]/10 border border-[#8e8b82]/20">
        baseline
      </span>
    );
  }

  const up = inverse ? pct <= 0 : pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold rounded-full px-2.5 py-1 ${
        up
          ? "bg-[#5db872]/12 text-[#5db872] border border-[#5db872]/20"
          : "bg-[#c64545]/12 text-[#c64545] border border-[#c64545]/20"
      }`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pct >= 0 ? "+" : ""}{formatPercentage(pct)}
    </span>
  );
}

export function KPICards({ kpis, isLoading, onOpenImport }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard dark />
        <SkeletonCard />
        <SkeletonCard />
        <div className="sm:col-span-2 lg:col-span-3">
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const currentRevenue = kpis?.currentWeekRevenue ?? 0;
  const previousRevenue = kpis?.previousWeekRevenue ?? 0;
  const currentUnits = kpis?.currentWeekUnits ?? 0;
  const previousUnits = kpis?.previousWeekUnits ?? 0;
  const currentAOV = kpis?.currentWeekAOV ?? 0;
  const previousAOV = kpis?.previousWeekAOV ?? 0;
  const monthRevenue = kpis?.monthRevenueSoFar ?? 0;
  const runRate = kpis?.projectedMonthRunRate ?? 0;

  const hasSalesHistory = currentUnits > 0 || previousUnits > 0 || monthRevenue > 0;
  const hasPreviousRevenue = previousRevenue > 0;
  const hasPreviousUnits = previousUnits > 0;
  const hasPreviousAOV = previousAOV > 0;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* 1. Revenue Card */}
      <div className="relative overflow-hidden rounded-xl border border-[#252320] bg-[#181715] p-7 row-span-1 shadow-card">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[#cc785c] opacity-[0.06] blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#6c6a64]">
              Total Revenue
            </span>
            <span className="text-[10px] font-mono text-[#a09d96] bg-[#252320] border border-[#3d3d3a] px-2 py-0.5 rounded">
              THIS WEEK
            </span>
          </div>

          <div className="mb-1">
            <span className="font-serif text-[#a09d96] text-xl leading-none">$</span>
          </div>
          <div
            className="font-serif text-[#faf9f5] leading-none mb-4"
            style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 400, letterSpacing: "-0.03em" }}
          >
            {currentRevenue >= 1000 ? (
              <>
                {(currentRevenue / 1000).toFixed(1)}
                <span className="text-2xl text-[#a09d96] ml-1">k</span>
              </>
            ) : (
              currentRevenue.toLocaleString()
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#252320]">
            <span className="text-xs text-[#6c6a64] font-mono">
              {hasPreviousRevenue
                ? `vs $${(previousRevenue / 1000).toFixed(1)}k last wk`
                : "No prior week baseline"}
            </span>
            <DeltaBadge pct={kpis?.revenueChangePct ?? 0} hasPreviousPeriod={hasPreviousRevenue} />
          </div>
        </div>
      </div>

      {/* 2. Units / Sales Count */}
      <div className="relative overflow-hidden rounded-xl border border-[#e6dfd8] bg-[#faf9f5] p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#8e8b82]">
            Weekly Orders
          </span>
          <div className="w-7 h-7 rounded-md bg-[#f5f0e8] border border-[#e6dfd8] flex items-center justify-center">
            <ShoppingCart className="h-3.5 w-3.5 text-[#cc785c]" />
          </div>
        </div>

        <div
          className="font-serif text-[#141413] leading-none mb-1"
          style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 400, letterSpacing: "-0.03em" }}
        >
          {currentUnits.toLocaleString()}
        </div>
        <p className="text-xs text-[#8e8b82] font-mono mb-4">orders placed</p>

        <div className="flex items-center justify-between pt-3.5 border-t border-[#e6dfd8]">
          <span className="text-xs text-[#8e8b82] font-mono">
            {hasPreviousUnits ? `vs ${previousUnits.toLocaleString()} last wk` : "No prior week data"}
          </span>
          <DeltaBadge pct={kpis?.unitsChangePct ?? 0} hasPreviousPeriod={hasPreviousUnits} />
        </div>
      </div>

      {/* 3. AOV */}
      <div className="relative overflow-hidden rounded-xl border border-[#e6dfd8] bg-[#f5f0e8] p-6 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#8e8b82]">
            Avg. Order Value
          </span>
          <div className="w-7 h-7 rounded-md bg-[#efe9de] border border-[#e6dfd8] flex items-center justify-center">
            <Receipt className="h-3.5 w-3.5 text-[#cc785c]" />
          </div>
        </div>

        <div className="flex items-start gap-1 mb-1">
          <span className="font-serif text-[#8e8b82] text-lg leading-none mt-2">$</span>
          <span
            className="font-serif text-[#141413] leading-none"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 400, letterSpacing: "-0.03em" }}
          >
            {Math.round(currentAOV).toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-[#8e8b82] font-mono mb-4">per transaction</p>

        <div className="flex items-center justify-between pt-3.5 border-t border-[#e6dfd8]">
          <span className="text-xs text-[#8e8b82] font-mono">
            {hasPreviousAOV ? `vs ${formatCurrency(previousAOV)}` : "No prior baseline"}
          </span>
          <DeltaBadge pct={kpis?.aovChangePct ?? 0} hasPreviousPeriod={hasPreviousAOV} />
        </div>
      </div>

      {/* 4. Run Rate */}
      <div className="sm:col-span-2 lg:col-span-3 relative overflow-hidden rounded-xl border border-[#cc785c]/25 bg-[#cc785c]/5 p-6 shadow-card">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#cc785c]/15 border border-[#cc785c]/25 flex items-center justify-center">
              <CalendarCheck2 className="h-5 w-5 text-[#cc785c]" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#cc785c]/80">
                End-of-Month Run Rate
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className="font-serif text-[#cc785c] leading-none"
                  style={{ fontSize: "2.4rem", fontWeight: 400, letterSpacing: "-0.03em" }}
                >
                  {formatCurrency(runRate)}
                </span>
                <span className="text-sm text-[#cc785c]/60 font-mono">projected</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-[10px] font-mono text-[#8e8b82] uppercase tracking-wider mb-1">MTD Revenue</p>
              <p className="font-serif text-xl text-[#141413]">{formatCurrency(monthRevenue)}</p>
            </div>
            <div className="w-px h-10 bg-[#cc785c]/20" />
            <div className="text-center">
              <p className="text-[10px] font-mono text-[#8e8b82] uppercase tracking-wider mb-1">Daily Run Rate</p>
              <p className="font-serif text-xl text-[#141413]" suppressHydrationWarning>
                {formatCurrency(monthRevenue / Math.max(1, new Date().getDate()))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
