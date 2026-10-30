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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WeeklyBarPoint } from "@/lib/analytics";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { BarChart3, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";

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
    <Card variant="card" className="border-hairline bg-surface-card shadow-subtle">
      <CardHeader className="flex flex-col space-y-2 pb-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="font-serif text-xl font-normal flex items-center gap-2 text-ink">
              <BarChart3 className="h-4 w-4 text-primary" />
              Week-over-Week Revenue Breakdown
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-[11px]">
              Last {data.length} Weeks
            </Badge>
          </div>
          <CardDescription className="mt-1">
            Aggregated revenue trend, order throughput, and velocity progression
          </CardDescription>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            <span className="text-body font-medium">Current Week</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-body" />
            <span className="text-muted">Past Weeks</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* KPI Strip */}
        <div className="mb-4 grid grid-cols-2 gap-2 rounded-md border border-hairline bg-canvas p-3 sm:grid-cols-4">
          <div>
            <span className="text-[11px] text-muted">Total Ledger Revenue:</span>
            <p className="font-mono text-base font-semibold text-ink">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted">Average Weekly Rev:</span>
            <p className="font-mono text-base font-semibold text-ink">
              {formatCurrency(avgWeeklyRevenue)}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted">Total Units Sold:</span>
            <p className="font-mono text-base font-semibold text-ink">
              {totalOrders.toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-muted">Peak Velocity Week:</span>
            <p className="font-mono text-base font-semibold text-primary truncate">
              {peakWeek.revenue > 0 ? `${peakWeek.weekLabel} (${formatCurrency(peakWeek.revenue)})` : "—"}
            </p>
          </div>
        </div>

        {isZeroState ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-2 border border-hairline rounded-lg bg-surface-soft/40 text-center p-6">
            <Layers className="h-8 w-8 text-[#cc785c] opacity-60" />
            <p className="text-sm font-medium text-ink">Awaiting Multi-Week Trend Data</p>
            <p className="text-xs text-muted max-w-sm">
              As transactions accumulate or are imported, your 10-week historical revenue cadence will render here.
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6dfd8" vertical={false} />
                <XAxis
                  dataKey="weekLabel"
                  stroke="#8e8b82"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "#e6dfd8" }}
                />
                <YAxis
                  stroke="#8e8b82"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as WeeklyBarPoint;
                      const isUp = item.velocityPct >= 0;

                      return (
                        <div className="rounded-md border border-hairline bg-surface-card p-3 text-xs shadow-card">
                          <p className="font-semibold text-ink border-b border-hairline pb-1 mb-1.5 font-serif">
                            {label} ({item.startDate} to {item.endDate})
                          </p>
                          <div className="space-y-1 font-mono">
                            <p className="flex justify-between gap-4 text-ink">
                              <span className="text-muted">Total Revenue:</span>
                              <span className="font-semibold">{formatCurrency(item.revenue)}</span>
                            </p>
                            <p className="flex justify-between gap-4 text-muted">
                              <span>Orders (Units):</span>
                              <span className="text-ink">{item.units}</span>
                            </p>
                            <p className="flex justify-between gap-4 text-muted">
                              <span>Average Order Value:</span>
                              <span className="text-ink">{formatCurrency(item.aov)}</span>
                            </p>
                            <p className="flex justify-between gap-4 pt-1 border-t border-hairline text-body">
                              <span>WoW Velocity:</span>
                              <span className={`font-semibold ${isUp ? "text-primary" : "text-error"}`}>
                                {isUp ? "+" : ""}
                                {item.velocityPct.toFixed(1)}%
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[3, 3, 0, 0]} maxBarSize={48}>
                  {data.map((entry, index) => {
                    const isLast = index === data.length - 1;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isLast ? "#cc785c" : "#252320"}
                        className="transition-opacity hover:opacity-80"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
