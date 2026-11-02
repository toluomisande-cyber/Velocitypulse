"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ForecastWeek {
  week: string;
  projected: number;
  low: number;
  high: number;
  confidence: number;
}

interface ForecastData {
  forecasts: ForecastWeek[];
  historicalWeekly: number[];
  slope: number;
  trendDirection: "up" | "down" | "flat";
  commentary: string | null;
  aiEnabled: boolean;
  isZeroState?: boolean;
}

export function AIForecastPanel({ className = "" }: { className?: string }) {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/forecast")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error ${r.status}`);
        return r.json();
      })
      .then((res) => {
        if (res) setData(res);
      })
      .catch((err) => {
        console.warn("Forecast fetch warning:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasData = data && Array.isArray(data.forecasts) && data.forecasts.length > 0;

  const TrendIcon =
    data?.trendDirection === "up"
      ? TrendingUp
      : data?.trendDirection === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    data?.trendDirection === "up"
      ? "text-[#16a34a]"
      : data?.trendDirection === "down"
      ? "text-[#dc2626]"
      : "text-[#7b7266]";

  const chartData = hasData
    ? [
        ...(data.historicalWeekly?.slice(-4).map((rev, i) => ({
          label: `W-${4 - i}`,
          revenue: rev,
          type: "historical",
        })) ?? []),
        ...(data.forecasts?.map((f, i) => ({
          label: `W+${i + 1}`,
          revenue: f.projected,
          type: "forecast",
        })) ?? []),
      ]
    : [];

  return (
    <div
      className={`rounded-xl border border-[#e5e1d8] bg-white overflow-hidden flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede6]">
        <div>
          <p className="text-[11px] font-medium text-[#7b7266]">
            Predictive modeling
          </p>
          <h3 className="font-serif text-lg font-normal text-[#1f1b16]">
            4-week forward projection
          </h3>
        </div>
        {hasData && (
          <div className={`flex items-center gap-1 text-xs font-mono font-medium ${trendColor}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{data.trendDirection.toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        {loading ? (
          <div className="h-44 flex items-center justify-center">
            <div className="h-4 w-32 bg-[#efe9df] rounded animate-pulse" />
          </div>
        ) : !hasData ? (
          <div className="py-12 text-center space-y-1">
            <p className="text-xs text-[#5e554a]">Awaiting transaction history</p>
            <p className="text-[11px] text-[#7b7266]">
              Import 2 or more weeks of sales to compute forward pacing.
            </p>
          </div>
        ) : (
          <>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                  <XAxis
                    dataKey="label"
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
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-md border border-[#e5e1d8] bg-white p-2 shadow-xs text-xs font-mono">
                            <p className="text-[#7b7266]">{d.label} · {d.type}</p>
                            <p className="font-medium text-[#1f1b16]">{formatCurrency(d.revenue)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.type === "forecast" ? "#c26a50" : "#d8d3c8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#f0ede6] text-[11px] font-mono text-[#7b7266]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-[#d8d3c8]" /> Historical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-xs bg-[#c26a50]" /> Projected
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
