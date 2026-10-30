"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VelocityGaugeData } from "@/lib/analytics";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Gauge, TrendingUp, TrendingDown, Info } from "lucide-react";

interface VelocityGaugeProps {
  data: VelocityGaugeData | null;
}

export function VelocityGauge({ data }: VelocityGaugeProps) {
  if (!data) return null;

  const {
    velocityPct,
    status,
    summaryText,
    currentWeekRevenue,
    previousWeekRevenue,
    deltaRevenue,
  } = data;

  const hasPreviousRevenue = previousWeekRevenue > 0;
  const isZeroState = currentWeekRevenue === 0 && previousWeekRevenue === 0;

  // Gauge angle calculation: map -50% to +50% range to 0deg to 180deg
  const clampedPct = Math.max(-50, Math.min(50, velocityPct));
  const normalized = (clampedPct + 50) / 100;
  const needleAngle = isZeroState ? 90 : normalized * 180;

  const isPositive = velocityPct >= 0;

  return (
    <Card variant="card" className="border-hairline bg-surface-card shadow-subtle">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="font-serif text-xl font-normal flex items-center gap-2 text-ink">
              <Gauge className="h-4 w-4 text-primary" />
              Growth Velocity Gauge
            </CardTitle>
          </div>
          <Badge
            variant={
              isZeroState
                ? "secondary"
                : status === "Hyper-Growth" || status === "High Velocity"
                ? "coral"
                : status === "Moderate Growth"
                ? "teal"
                : "destructive"
            }
            className="text-xs font-semibold px-2.5 py-0.5"
          >
            {isZeroState ? "Awaiting Data" : status}
          </Badge>
        </div>
        <CardDescription>
          Week-over-Week formula: ((This_Week - Last_Week) / Last_Week) × 100
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Speedometer Gauge Visual */}
        <div className="relative flex flex-col items-center justify-center pt-2">
          <svg className="w-64 h-36 overflow-visible" viewBox="0 0 200 110">
            <defs>
              <linearGradient id="velocityGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#c64545" />    {/* Error Crimson */}
                <stop offset="35%" stopColor="#e8a55a" />   {/* Accent Amber */}
                <stop offset="65%" stopColor="#5db8a6" />   {/* Accent Teal */}
                <stop offset="100%" stopColor="#cc785c" />  {/* Signature Coral */}
              </linearGradient>
            </defs>

            {/* Background Arc Track */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e6dfd8"
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Gradient Colored Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={isZeroState ? "#e6dfd8" : "url(#velocityGaugeGradient)"}
              strokeWidth="14"
              strokeLinecap="round"
              strokeOpacity="0.9"
            />

            {/* Needle Pivot Indicator */}
            <g transform={`rotate(${needleAngle - 90}, 100, 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke="#141413"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="7" fill="#141413" />
              <circle cx="100" cy="100" r="3" fill="#faf9f5" />
            </g>
          </svg>

          {/* Scale Labels */}
          <div className="flex w-64 justify-between px-2 text-[10px] text-muted font-mono -mt-2">
            <span>-50%</span>
            <span>0% (Par)</span>
            <span>+50%</span>
          </div>

          {/* Velocity Rate Readout */}
          <div className="mt-3 text-center">
            {isZeroState || !hasPreviousRevenue ? (
              <div className="text-center">
                <span className="font-serif text-3xl font-normal tracking-tight text-ink">
                  —
                </span>
                <p className="text-xs text-muted mt-0.5 font-sans">
                  {isZeroState ? "Awaiting Sales Data" : "Baseline Cycle"}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-1.5">
                  {isPositive ? (
                    <TrendingUp className="h-6 w-6 text-primary stroke-[2.5]" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-error stroke-[2.5]" />
                  )}
                  <span
                    className={`font-serif text-3xl font-normal tracking-tight ${
                      isPositive ? "text-primary" : "text-error"
                    }`}
                  >
                    {formatPercentage(velocityPct)}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5 font-sans">
                  Week-over-Week Growth Rate
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="mt-4 rounded-md border border-hairline bg-canvas p-3 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted">Current Week Revenue:</span>
            <span className="font-mono font-medium text-ink">
              {formatCurrency(currentWeekRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Previous Week Baseline:</span>
            <span className="font-mono text-muted">
              {hasPreviousRevenue ? formatCurrency(previousWeekRevenue) : "—"}
            </span>
          </div>
          <div className="border-t border-hairline pt-2 flex items-center justify-between">
            <span className="font-medium text-body">Net Revenue Delta:</span>
            <span
              className={`font-mono font-semibold ${
                deltaRevenue > 0
                  ? "text-primary"
                  : deltaRevenue < 0
                  ? "text-error"
                  : "text-muted"
              }`}
            >
              {hasPreviousRevenue ? (
                <>
                  {deltaRevenue >= 0 ? "+" : ""}
                  {formatCurrency(deltaRevenue)}
                </>
              ) : (
                "—"
              )}
            </span>
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-muted italic">
          {isZeroState
            ? "Upload transactions using the Import CSV tool to measure real-time growth pacing."
            : summaryText}
        </p>
      </CardContent>
    </Card>
  );
}
