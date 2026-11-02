"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DailyVelocityPoint } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";
import { Activity } from "lucide-react";

interface WeeklyGrowthChartProps {
  data: DailyVelocityPoint[];
}

export function WeeklyGrowthChart({ data }: WeeklyGrowthChartProps) {
  const [viewMode, setViewMode] = useState<"daily" | "cumulative">("daily");

  const currentKey = viewMode === "daily" ? "currentWeek" : "currentWeekCumulative";
  const previousKey = viewMode === "daily" ? "previousWeek" : "previousWeekCumulative";

  const totalCurr = data.reduce((acc, d) => acc + d.currentWeek, 0);
  const totalPrev = data.reduce((acc, d) => acc + d.previousWeek, 0);
  const delta = totalCurr - totalPrev;
  const deltaPct = totalPrev > 0 ? (delta / totalPrev) * 100 : 0;
  const isZeroState = totalCurr === 0 && totalPrev === 0;

  return (
    <div className="rounded-xl border border-[#e5e1d8] bg-white p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col space-y-3 pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 border-b border-[#f0ede6]">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#c26a50]" />
            <h3 className="font-serif text-lg font-normal text-[#1f1b16]">
              Weekly sales velocity curve
            </h3>
            <span className="text-[10px] font-mono text-[#7b7266] bg-[#f0ede6] px-1.5 py-0.5 rounded">
              Mon – Sun
            </span>
          </div>
          <p className="text-xs text-[#5e554a] mt-0.5">
            Daily velocity pace compared against prior 7-day period
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border border-[#e5e1d8] bg-[#f7f5f0] p-0.5 self-start sm:self-auto text-xs">
          <button
            onClick={() => setViewMode("daily")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              viewMode === "daily"
                ? "bg-white text-[#1f1b16] font-medium shadow-xs"
                : "text-[#7b7266] hover:text-[#1f1b16]"
            }`}
          >
            Daily pace
          </button>
          <button
            onClick={() => setViewMode("cumulative")}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              viewMode === "cumulative"
                ? "bg-white text-[#1f1b16] font-medium shadow-xs"
                : "text-[#7b7266] hover:text-[#1f1b16]"
            }`}
          >
            Cumulative
          </button>
        </div>
      </div>

      {/* KPI Micro Strip */}
      <div className="my-4 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-lg border border-[#f0ede6] bg-[#faf9f5] p-3 text-xs">
        <div>
          <span className="text-[11px] text-[#7b7266]">Current cycle:</span>
          <p className="font-mono text-sm font-medium text-[#1f1b16] tabular-nums">
            {formatCurrency(totalCurr)}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-[#7b7266]">Prior cycle:</span>
          <p className="font-mono text-sm font-medium text-[#1f1b16] tabular-nums">
            {formatCurrency(totalPrev)}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] text-[#7b7266]">Net pacing:</span>
          <p
            className={`font-mono text-sm font-medium tabular-nums ${
              delta >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"
            }`}
          >
            {totalPrev > 0 ? `${delta >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%` : "Baseline"}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {isZeroState ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <p className="text-xs text-[#5e554a]">No transactions in current window</p>
            <p className="text-[11px] text-[#7b7266]">
              Import sales records to plot velocity curves.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="unslopCurrentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c26a50" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#c26a50" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis
                dataKey="day"
                stroke="#7b7266"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                fontFamily="monospace"
              />
              <YAxis
                stroke="#7b7266"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                fontFamily="monospace"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-[#e5e1d8] bg-white p-2.5 shadow-sm text-xs font-mono space-y-1">
                        <p className="text-[11px] text-[#7b7266] font-sans">{label}</p>
                        {payload.map((p, i) => (
                          <div key={i} className="flex items-center justify-between gap-4">
                            <span className="text-[#5e554a]">
                              {p.dataKey === currentKey ? "Current:" : "Prior:"}
                            </span>
                            <span className="font-medium text-[#1f1b16]">
                              {formatCurrency(Number(p.value) || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={previousKey}
                stroke="#d8d3c8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fill="none"
              />
              <Area
                type="monotone"
                dataKey={currentKey}
                stroke="#c26a50"
                strokeWidth={2}
                fill="url(#unslopCurrentGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#f0ede6] text-[11px] font-mono text-[#7b7266]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-[#c26a50]" /> Current cycle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-3 bg-[#d8d3c8] border-t border-dashed" /> Prior cycle
          </span>
        </div>
      </div>
    </div>
  );
}
