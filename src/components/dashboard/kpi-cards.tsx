"use client";

import React from "react";
import { KPISummary } from "@/lib/analytics";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KPICardsProps {
  kpis: KPISummary | null;
  isLoading?: boolean;
  onOpenImport?: () => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#e5e1d8] bg-white p-5 animate-pulse">
      <div className="h-3 w-20 bg-[#efe9df] rounded mb-4" />
      <div className="h-8 w-32 bg-[#efe9df] rounded mb-3" />
      <div className="h-3 w-28 bg-[#efe9df] rounded" />
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
      <span className="text-[10px] font-mono text-[#7b7266] px-1.5 py-0.5 rounded bg-[#efe9df]">
        baseline
      </span>
    );
  }

  const up = inverse ? pct <= 0 : pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-mono font-medium rounded px-1.5 py-0.5 ${
        up
          ? "bg-[#16a34a]/10 text-[#16a34a]"
          : "bg-[#dc2626]/10 text-[#dc2626]"
      }`}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {pct >= 0 ? "+" : ""}{formatPercentage(pct)}
    </span>
  );
}

export function KPICards({ kpis, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
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

  const hasPreviousRevenue = previousRevenue > 0;
  const hasPreviousUnits = previousUnits > 0;
  const hasPreviousAOV = previousAOV > 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Revenue */}
      <div className="rounded-xl border border-[#e5e1d8] bg-white p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#5e554a]">Current cycle revenue</span>
            <span className="text-[10px] font-mono text-[#7b7266]">7-day</span>
          </div>

          <div className="flex items-baseline gap-1 mb-3">
            <span className="font-serif text-2xl text-[#7b7266]">$</span>
            <span className="font-serif text-3xl font-normal text-[#1f1b16] tracking-tight tabular-nums">
              {currentRevenue >= 1000 ? (
                <>
                  {(currentRevenue / 1000).toFixed(1)}
                  <span className="text-xl text-[#7b7266] ml-0.5">k</span>
                </>
              ) : (
                currentRevenue.toLocaleString()
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#f0ede6] text-xs font-mono text-[#7b7266]">
          <span>
            {hasPreviousRevenue
              ? `vs $${(previousRevenue / 1000).toFixed(1)}k prior`
              : "No prior baseline"}
          </span>
          <DeltaBadge pct={kpis?.revenueChangePct ?? 0} hasPreviousPeriod={hasPreviousRevenue} />
        </div>
      </div>

      {/* 2. Order Volume */}
      <div className="rounded-xl border border-[#e5e1d8] bg-white p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#5e554a]">Weekly volume</span>
            <span className="text-[10px] font-mono text-[#7b7266]">Orders</span>
          </div>

          <div className="font-serif text-3xl font-normal text-[#1f1b16] tracking-tight mb-3 tabular-nums">
            {currentUnits.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#f0ede6] text-xs font-mono text-[#7b7266]">
          <span>
            {hasPreviousUnits ? `vs ${previousUnits.toLocaleString()} prior` : "No prior baseline"}
          </span>
          <DeltaBadge pct={kpis?.unitsChangePct ?? 0} hasPreviousPeriod={hasPreviousUnits} />
        </div>
      </div>

      {/* 3. AOV */}
      <div className="rounded-xl border border-[#e5e1d8] bg-white p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#5e554a]">Average order value</span>
            <span className="text-[10px] font-mono text-[#7b7266]">Per sale</span>
          </div>

          <div className="flex items-baseline gap-1 mb-3">
            <span className="font-serif text-2xl text-[#7b7266]">$</span>
            <span className="font-serif text-3xl font-normal text-[#1f1b16] tracking-tight tabular-nums">
              {Math.round(currentAOV).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#f0ede6] text-xs font-mono text-[#7b7266]">
          <span>
            {hasPreviousAOV ? `vs ${formatCurrency(previousAOV)}` : "No prior baseline"}
          </span>
          <DeltaBadge pct={kpis?.aovChangePct ?? 0} hasPreviousPeriod={hasPreviousAOV} />
        </div>
      </div>

      {/* 4. Projected Run Rate */}
      <div className="rounded-xl border border-[#e5e1d8] bg-white p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-[#5e554a]">Projected run rate</span>
            <span className="text-[10px] font-mono text-[#7b7266]">Month end</span>
          </div>

          <div className="font-serif text-3xl font-normal text-[#c26a50] tracking-tight mb-3 tabular-nums">
            {formatCurrency(runRate)}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#f0ede6] text-xs font-mono text-[#7b7266]">
          <span>MTD {formatCurrency(monthRevenue)}</span>
          <span className="text-[11px] text-[#5e554a]">Paced</span>
        </div>
      </div>
    </div>
  );
}
