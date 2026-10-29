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
import { BarChart3, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface WoWBreakdownChartProps {
  data: WeeklyBarPoint[];
}

export function WoWBreakdownChart({ data }: WoWBreakdownChartProps) {
  const totalRevenue = data.reduce((sum, w) => sum + w.revenue, 0);
  const avgWeeklyRevenue = data.length > 0 ? totalRevenue / data.length : 0;
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

      <CardContent className="pt-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e6dfd8" vertical={false} />

              <XAxis
                dataKey="weekLabel"
                stroke="#6c6a64"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#e6dfd8" }}
              />

              <YAxis
                stroke="#6c6a64"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />

              <Tooltip
                cursor={{ fill: "rgba(204, 120, 92, 0.06)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as WeeklyBarPoint;
                    const isPositive = item.velocityPct >= 0;

                    return (
                      <div className="rounded-md border border-hairline bg-canvas p-3.5 shadow-card min-w-[200px]">
                        <div className="flex items-center justify-between border-b border-hairline pb-2 mb-2">
                          <span className="font-serif text-sm font-normal text-ink">
                            {item.weekLabel}
                          </span>
                          <span className="text-[10px] text-muted">
                            {item.startDate}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted">Revenue:</span>
                            <span className="font-mono font-semibold text-primary">
                              {formatCurrency(item.revenue)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted">Volume:</span>
                            <span className="font-mono text-ink">
                              {item.units} transactions
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-muted">AOV:</span>
                            <span className="font-mono text-ink">
                              {formatCurrency(item.aov)}
                            </span>
                          </div>

                          <div className="pt-2 mt-1 border-t border-hairline flex items-center justify-between">
                            <span className="text-muted">WoW Velocity:</span>
                            <span
                              className={`flex items-center gap-0.5 font-mono font-semibold ${
                                isPositive ? "text-emerald-700" : "text-error"
                              }`}
                            >
                              {isPositive ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {formatPercentage(item.velocityPct)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {data.map((entry, index) => {
                  const isCurrentWeek = index === data.length - 1;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isCurrentWeek ? "#cc785c" : "#3d3d3a"}
                      className="hover:opacity-85 transition-opacity"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Aggregate KPI footer strip */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 border-t border-hairline pt-3 text-xs">
          <div className="flex items-center justify-between sm:justify-start sm:gap-2">
            <span className="text-muted">10-Week Total:</span>
            <span className="font-mono font-medium text-ink">
              {formatCurrency(totalRevenue)}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start sm:gap-2">
            <span className="text-muted">Weekly Average:</span>
            <span className="font-mono font-medium text-ink">
              {formatCurrency(avgWeeklyRevenue)}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-start sm:gap-2">
            <span className="text-muted">Peak Week:</span>
            <span className="font-mono font-medium text-primary">
              {peakWeek.weekLabel} ({formatCurrency(peakWeek.revenue)})
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
