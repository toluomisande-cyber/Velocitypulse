"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ClaudeMark } from "@/components/ui/claude-mark";

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
        if (res && Array.isArray(res.forecasts)) {
          setData(res);
        }
      })
      .catch((err) => {
        console.warn("Forecast fetch warning:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const TrendIcon =
    data?.trendDirection === "up"
      ? TrendingUp
      : data?.trendDirection === "down"
      ? TrendingDown
      : Minus;

  const trendColor =
    data?.trendDirection === "up"
      ? "#5db872"
      : data?.trendDirection === "down"
      ? "#c64545"
      : "#a09d96";

  const chartData = data
    ? [
        ...(data.historicalWeekly?.slice(-4).map((rev, i) => ({
          label: `W-${4 - i}`,
          revenue: rev,
          type: "historical",
        })) ?? []),
        ...(data.forecasts?.map((f, i) => ({
          label: `W+${i + 1}`,
          revenue: f.projected,
          low: f.low,
          high: f.high,
          type: "forecast",
        })) ?? []),
      ]
    : [];

  return (
    <div
      className={`rounded-xl border border-[#e6dfd8] bg-[#faf9f5] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6dfd8]">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-[#cc785c]" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#8e8b82]">
              AI Revenue Forecast
            </p>
            <h3 className="font-serif text-base font-normal text-[#141413] leading-tight">
              4-Week Forward Projection
            </h3>
          </div>
        </div>
        {data && (
          <div
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: trendColor }}
          >
            <TrendIcon className="h-4 w-4" />
            <span className="font-mono text-xs">
              {data.slope > 0 ? "+" : ""}
              {formatCurrency(data.slope)} / wk
            </span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-[#efe9de] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={20}>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#8e8b82", fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: "#181715",
                      border: "1px solid #252320",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#faf9f5",
                      fontFamily: "Inter",
                    }}
                    formatter={(val: number) => [formatCurrency(val), "Revenue"]}
                    labelStyle={{ color: "#a09d96" }}
                  />
                  <Bar dataKey="revenue" radius={[3, 3, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.type === "historical"
                            ? "#e6dfd8"
                            : i === chartData.length - 1
                            ? "#cc785c"
                            : "#cc785c80"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Forecast rows */}
            <div className="space-y-2">
              {data?.forecasts?.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#f5f0e8] border border-[#e6dfd8]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[#8e8b82] w-8">
                      W+{i + 1}
                    </span>
                    <span className="text-xs text-[#6c6a64]">{f.week}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[#8e8b82]">
                      {formatCurrency(f.low)} – {formatCurrency(f.high)}
                    </span>
                    <span className="font-serif text-sm font-normal text-[#cc785c]">
                      {formatCurrency(f.projected)}
                    </span>
                    <div className="w-12 h-1.5 bg-[#e6dfd8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#cc785c] rounded-full"
                        style={{ width: `${f.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-[#8e8b82]">
                      {Math.round(f.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Commentary */}
            {data?.commentary && (
              <div className="flex gap-3 p-3.5 rounded-lg bg-[#cc785c]/8 border border-[#cc785c]/20">
                <ClaudeMark className="h-4 w-4 text-[#cc785c] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#3d3d3a] leading-relaxed italic">
                  {data.commentary}
                </p>
              </div>
            )}

            <p className="text-[10px] font-mono text-[#8e8b82] text-center">
              Predictive linear regression model · 95% dynamic confidence interval
            </p>
          </>
        )}
      </div>
    </div>
  );
}
