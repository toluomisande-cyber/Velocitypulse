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
import { Activity, Zap, TrendingUp } from "lucide-react";

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

      <CardContent className="pt-2">
        {/* KPI Strip */}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-md border border-surface-dark-elevated bg-surface-dark-soft p-3 sm:grid-cols-3">
          <div>
            <span className="text-[11px] text-on-dark-soft">This Week:</span>
            <p className="font-mono text-base font-semibold text-on-dark">
              {formatCurrency(totalCurr)}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-on-dark-soft">Prior Week:</span>
            <p className="font-mono text-base font-semibold text-on-dark-soft">
              {totalPrev > 0 ? formatCurrency(totalPrev) : "—"}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] text-on-dark-soft">Delta:</span>
            <p
              className={`font-mono text-base font-semibold ${
                delta > 0
                  ? "text-primary"
                  : delta < 0
                  ? "text-error"
                  : "text-on-dark-soft"
              }`}
            >
              {totalPrev > 0 ? (
                <>
                  {delta >= 0 ? "+" : ""}
                  {formatCurrency(delta)} ({deltaPct >= 0 ? "+" : ""}
                  {deltaPct.toFixed(1)}%)
                </>
              ) : (
                "—"
              )}
            </p>
          </div>
        </div>

        {isZeroState ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 border border-surface-dark-elevated rounded-lg bg-surface-dark-soft/50 text-center p-6">
            <Activity className="h-8 w-8 text-[#cc785c] opacity-60" />
            <p className="text-sm font-medium text-on-dark">Awaiting Weekly Velocity Data</p>
            <p className="text-xs text-on-dark-soft max-w-sm">
              Your daily Monday through Sunday velocity curve will render automatically once sales are recorded.
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="velocityCoralGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#cc785c" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#cc785c" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="velocityBaselineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8e8b82" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8e8b82" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#252320"
                  vertical={false}
                />

                <XAxis
                  dataKey="dayShort"
                  stroke="#6c6a64"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#252320" }}
                />

                <YAxis
                  stroke="#6c6a64"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const curr = Number(payload.find((p) => p.dataKey === currentKey)?.value || 0);
                      const prev = Number(payload.find((p) => p.dataKey === previousKey)?.value || 0);
                      const diff = curr - prev;

                      return (
                        <div className="rounded-md border border-surface-dark-elevated bg-surface-dark p-3 text-xs shadow-dark">
                          <p className="font-semibold text-on-dark border-b border-surface-dark-elevated pb-1 mb-1.5 font-serif">
                            {label} ({viewMode === "daily" ? "Daily" : "Cumulative"})
                          </p>
                          <div className="space-y-1 font-mono">
                            <p className="text-primary flex items-center justify-between gap-4">
                              <span>This Week:</span>
                              <span className="font-semibold">{formatCurrency(curr)}</span>
                            </p>
                            <p className="text-on-dark-soft flex items-center justify-between gap-4">
                              <span>Prior Week:</span>
                              <span>{prev > 0 ? formatCurrency(prev) : "—"}</span>
                            </p>
                            {prev > 0 && (
                              <p
                                className={`pt-1 border-t border-surface-dark-elevated flex items-center justify-between gap-4 ${
                                  diff >= 0 ? "text-accent-teal" : "text-error"
                                }`}
                              >
                                <span>Variance:</span>
                                <span>
                                  {diff >= 0 ? "+" : ""}
                                  {formatCurrency(diff)}
                                </span>
                              </p>
                            )}
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
                  height={30}
                  iconType="circle"
                  iconSize={7}
                  formatter={(value) => (
                    <span className="text-[11px] font-sans text-on-dark-soft capitalize">
                      {value === currentKey ? "Current Week" : "Prior Baseline"}
                    </span>
                  )}
                />

                <Area
                  type="monotone"
                  dataKey={previousKey}
                  name={previousKey}
                  stroke="#6c6a64"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#velocityBaselineGrad)"
                />

                <Area
                  type="monotone"
                  dataKey={currentKey}
                  name={currentKey}
                  stroke="#cc785c"
                  strokeWidth={2.5}
                  fill="url(#velocityCoralGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
