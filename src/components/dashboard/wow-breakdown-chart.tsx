"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { WeeklyBarPoint } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";
import { BarChart3 } from "lucide-react";

interface WoWBreakdownChartProps {
  data: WeeklyBarPoint[];
}

export function WoWBreakdownChart({ data }: WoWBreakdownChartProps) {
  const totalRevenue = data.reduce((sum, w) => sum + w.revenue, 0);
  const totalOrders = data.reduce((sum, w) => sum + w.units, 0);
  const avgWeeklyRevenue = data.length > 0 ? totalRevenue / data.length : 0;
  const isZeroState = totalRevenue === 0 && totalOrders === 0;

  const peakWeek = data.reduce(
    (max, w) => (w.revenue > max.revenue ? w : max),
    data[0] || { weekLabel: "N/A", revenue: 0 }
  );

  return (
    <div className="rounded-xl border border-[#e5e1d8] bg-white p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col space-y-3 pb-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 border-b border-[#f0ede6]">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#c26a50]" />
            <h3 className="font-serif text-lg font-normal text-[#1f1b16]">
              Weekly revenue progression
            </h3>
            <span className="text-[10px] font-mono text-[#7b7266] bg-[#f0ede6] px-1.5 py-0.5 rounded">
              Last {data.length} weeks
            </span>
          </div>
          <p className="text-xs text-[#5e554a] mt-0.5">
            Aggregated revenue pace and order throughput per weekly cycle
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-[#7b7266]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-[#c26a50]" /> Current cycle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-xs bg-[#d8d3c8]" /> Prior cycles
          </span>
        </div>
      </div>

      {/* KPI summary strip */}
      <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-[#f0ede6] bg-[#faf9f5] p-3 text-xs">
        <div>
          <span className="text-[11px] text-[#7b7266]">Total revenue:</span>
          <p className="font-mono text-sm font-medium text-[#1f1b16] tabular-nums">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-[#7b7266]">Weekly average:</span>
          <p className="font-mono text-sm font-medium text-[#1f1b16] tabular-nums">
            {formatCurrency(avgWeeklyRevenue)}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-[#7b7266]">Orders placed:</span>
          <p className="font-mono text-sm font-medium text-[#1f1b16] tabular-nums">
            {totalOrders.toLocaleString()}
          </p>
        </div>
        <div>
          <span className="text-[11px] text-[#7b7266]">Peak week:</span>
          <p className="font-mono text-sm font-medium text-[#c26a50] truncate tabular-nums">
            {peakWeek.revenue > 0 ? `${peakWeek.weekLabel} (${formatCurrency(peakWeek.revenue)})` : "—"}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        {isZeroState ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <p className="text-xs text-[#5e554a]">No historical weeks recorded</p>
            <p className="text-[11px] text-[#7b7266]">
              Import multi-week transactions to view historical trends.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis
                dataKey="weekLabel"
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
                cursor={{ fill: "rgba(0,0,0,0.02)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as WeeklyBarPoint;
                    return (
                      <div className="rounded-lg border border-[#e5e1d8] bg-white p-2.5 shadow-sm text-xs font-mono space-y-1">
                        <p className="font-sans font-medium text-[#1f1b16]">{d.weekLabel}</p>
                        <p className="text-[#c26a50]">{formatCurrency(d.revenue)}</p>
                        <p className="text-[#7b7266]">{d.units} transactions · AOV {formatCurrency(d.aov)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                {data.map((entry, index) => {
                  const isLast = index === data.length - 1;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isLast ? "#c26a50" : "#d8d3c8"}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
