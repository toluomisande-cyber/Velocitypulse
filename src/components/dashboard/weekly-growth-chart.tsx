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
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DailyVelocityPoint } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";
import { Activity, Zap } from "lucide-react";

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

  return (
    <Card variant="dark" className="border-surface-dark-elevated bg-surface-dark text-on-dark shadow-dark">
      <CardHeader className="flex flex-col space-y-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="font-serif text-xl font-normal flex items-center gap-2 text-on-dark">
              <Activity className="h-4 w-4 text-primary" />
              Weekly Sales Velocity Curve
            </CardTitle>
            <Badge variant="dark" className="font-mono text-[11px]">
              Mon – Sun Pacing
            </Badge>
          </div>
          <CardDescription className="mt-1 text-on-dark-soft">
            Visualizing daily sales velocity compared against the prior baseline
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-md border border-surface-dark-elevated bg-surface-dark-soft p-1">
            <button
              onClick={() => setViewMode("daily")}
              className={`rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "daily"
                  ? "bg-surface-dark-elevated text-on-dark shadow-subtle"
                  : "text-on-dark-soft hover:text-on-dark"
              }`}
            >
              Daily Sales
            </button>
            <button
              onClick={() => setViewMode("cumulative")}
              className={`rounded-sm px-3 py-1 text-xs font-medium transition-colors ${
                viewMode === "cumulative"
                  ? "bg-surface-dark-elevated text-on-dark shadow-subtle"
                  : "text-on-dark-soft hover:text-on-dark"
              }`}
            >
              Cumulative Pace
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                {/* Velocity Pulse Coral Gradient */}
                <linearGradient id="velocityCoralGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#cc785c" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#cc785c" stopOpacity={0.0} />
                </linearGradient>
                {/* Muted Baseline Gradient */}
                <linearGradient id="velocityBaselineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a09d96" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#a09d96" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#252320" vertical={false} />

              <XAxis
                dataKey="dayShort"
                stroke="#8e8b82"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#252320" }}
              />

              <YAxis
                stroke="#8e8b82"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const curr = Number(payload.find((p) => p.dataKey === currentKey)?.value || 0);
                    const prev = Number(payload.find((p) => p.dataKey === previousKey)?.value || 0);
                    const diff = curr - prev;
                    const diffPct = prev > 0 ? (diff / prev) * 100 : 0;

                    return (
                      <div className="rounded-md border border-surface-dark-elevated bg-surface-dark-elevated p-3.5 shadow-xl text-on-dark min-w-[210px]">
                        <p className="font-serif text-sm font-normal text-on-dark border-b border-surface-dark-soft pb-1.5 mb-2">
                          {label} (Velocity Breakdown)
                        </p>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-primary font-medium">
                              <span className="h-2 w-2 rounded-full bg-primary" />
                              Current Week:
                            </span>
                            <span className="font-mono font-semibold text-on-dark">
                              {formatCurrency(curr)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-on-dark-soft">
                              <span className="h-2 w-2 rounded-full bg-muted-soft" />
                              Previous Week:
                            </span>
                            <span className="font-mono text-on-dark-soft">
                              {formatCurrency(prev)}
                            </span>
                          </div>

                          <div className="pt-2 mt-1 border-t border-surface-dark-soft flex items-center justify-between gap-4 text-[11px]">
                            <span className="text-on-dark-soft">Velocity Delta:</span>
                            <span
                              className={`font-mono font-medium ${
                                diff >= 0 ? "text-primary" : "text-error"
                              }`}
                            >
                              {diff >= 0 ? "+" : ""}
                              {formatCurrency(diff)} ({diffPct >= 0 ? "+" : ""}
                              {diffPct.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
                formatter={(value) => {
                  return (
                    <span className="text-on-dark-soft text-xs">
                      {value === currentKey ? "Current Week (Live)" : "Previous Week (Benchmark)"}
                    </span>
                  );
                }}
              />

              {/* Previous Week Baseline */}
              <Area
                type="monotone"
                dataKey={previousKey}
                name={previousKey}
                stroke="#8e8b82"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#velocityBaselineGrad)"
              />

              {/* Current Week Coral Curve */}
              <Area
                type="monotone"
                dataKey={currentKey}
                name={currentKey}
                stroke="#cc785c"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#velocityCoralGrad)"
                activeDot={{ r: 6, fill: "#cc785c", stroke: "#181715", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom velocity insight pill */}
        <div className="mt-4 flex items-center justify-between rounded-md border border-surface-dark-elevated bg-surface-dark-soft px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-on-dark-soft">
              {delta >= 0 ? "Velocity Ahead:" : "Velocity Behind:"}
            </span>
            <span
              className={`font-mono font-semibold ${
                delta >= 0 ? "text-primary" : "text-error"
              }`}
            >
              {delta >= 0 ? "+" : ""}
              {formatCurrency(delta)} ({deltaPct >= 0 ? "+" : ""}
              {deltaPct.toFixed(1)}% vs prior week)
            </span>
          </div>

          <span className="text-[11px] text-on-dark-soft hidden sm:inline">
            Normalized 7-day pacing window
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
