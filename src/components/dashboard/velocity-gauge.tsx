"use client";

import React from "react";
import { VelocityGaugeData } from "@/lib/analytics";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Gauge, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface VelocityGaugeProps {
  data: VelocityGaugeData | null;
}

export function VelocityGauge({ data }: VelocityGaugeProps) {
  if (!data) return null;

  const {
    velocityPct,
    status,
    currentWeekRevenue,
    previousWeekRevenue,
    deltaRevenue,
  } = data;

  const hasPreviousRevenue = previousWeekRevenue > 0;
  const isZeroState = currentWeekRevenue === 0 && previousWeekRevenue === 0;

  // Clamped progress: -50% to +50% range to 0 to 100
  const clampedPct = Math.max(-50, Math.min(50, velocityPct));
  const normalized = (clampedPct + 50) / 100;
  const needleAngle = isZeroState ? 90 : normalized * 180;
  const isPositive = velocityPct >= 0;

  return (
    <div className="rounded-xl border border-[#e5e1d8] bg-white p-5 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#f0ede6]">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[#c26a50]" />
            <h3 className="font-serif text-lg font-normal text-[#1f1b16]">
              Growth pace
            </h3>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              isZeroState
                ? "bg-[#f0ede6] text-[#7b7266]"
                : isPositive
                ? "bg-[#16a34a]/10 text-[#16a34a]"
                : "bg-[#dc2626]/10 text-[#dc2626]"
            }`}
          >
            {isZeroState ? "Awaiting data" : status}
          </span>
        </div>

        {/* Minimal Arc Gauge */}
        <div className="relative flex flex-col items-center justify-center pt-4">
          <svg className="w-56 h-32 overflow-visible" viewBox="0 0 200 110">
            {/* Background Track */}
            <path
              d="M 24 100 A 76 76 0 0 1 176 100"
              fill="none"
              stroke="#f0ede6"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Active Single-Tone Arc */}
            {!isZeroState && (
              <path
                d="M 24 100 A 76 76 0 0 1 176 100"
                fill="none"
                stroke={isPositive ? "#c26a50" : "#7b7266"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="240"
                strokeDashoffset={240 * (1 - normalized)}
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Needle */}
            <g transform={`rotate(${needleAngle - 90}, 100, 100)`} className="transition-transform duration-700 ease-out">
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="34"
                stroke="#1f1b16"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="5" fill="#1f1b16" />
            </g>
          </svg>

          {/* Value Display */}
          <div className="text-center -mt-4">
            <div className="flex items-center justify-center gap-1">
              {hasPreviousRevenue ? (
                <span
                  className={`font-serif text-2xl font-normal tracking-tight tabular-nums ${
                    isPositive ? "text-[#1f1b16]" : "text-[#dc2626]"
                  }`}
                >
                  {isPositive ? "+" : ""}{formatPercentage(velocityPct)}
                </span>
              ) : (
                <span className="font-serif text-2xl font-normal text-[#7b7266]">
                  —
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#7b7266] font-mono mt-0.5">
              {hasPreviousRevenue ? "week-over-week velocity" : "initial cycle"}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="pt-3 border-t border-[#f0ede6] flex items-center justify-between text-xs font-mono text-[#7b7266]">
        <span>Net delta:</span>
        <span className="font-medium text-[#1f1b16] tabular-nums">
          {hasPreviousRevenue
            ? `${deltaRevenue >= 0 ? "+" : ""}${formatCurrency(deltaRevenue)}`
            : "—"}
        </span>
      </div>
    </div>
  );
}
