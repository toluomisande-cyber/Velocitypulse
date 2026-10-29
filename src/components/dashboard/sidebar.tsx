"use client";

import React from "react";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Receipt,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Activity,
  Sparkles,
} from "lucide-react";
import { ClaudeMark } from "@/components/ui/claude-mark";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { id: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
  { id: "velocity", label: "Weekly Sales Velocity", icon: Activity },
  { id: "trends", label: "WoW Revenue Trends", icon: TrendingUp },
  { id: "transactions", label: "Sales Log & Table", icon: Receipt },
  { id: "ingestion", label: "Data Ingestion (CSV)", icon: FileSpreadsheet },
];

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  activeTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-hairline bg-surface-soft transition-all duration-300 md:static md:z-30",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-20" : "md:w-64"
        )}
      >
        {/* Brand / Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-hairline px-4 bg-canvas/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-canvas border border-hairline shadow-subtle">
              <ClaudeMark className="h-5 w-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-serif text-base font-normal tracking-tight text-ink">
                  VelocityPulse
                </span>
                <span className="truncate text-[10px] text-muted font-sans">
                  Executive Suite
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md border border-hairline text-muted hover:bg-surface-card hover:text-ink transition-colors"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-soft">
              Analytics & Tracking
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "bg-surface-card text-ink font-semibold shadow-subtle border border-hairline/80"
                    : "text-body hover:bg-surface-card/60 hover:text-ink"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted group-hover:text-ink"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate text-left">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom system status indicator */}
        <div className="border-t border-hairline p-3 bg-canvas/40">
          <div
            className={cn(
              "flex items-center gap-2.5 rounded-md border border-hairline bg-surface-card p-2.5 shadow-subtle",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <div className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-teal opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-teal"></span>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="truncate text-[11px] font-medium text-ink">
                  Neon Postgres Connected
                </p>
                <p className="truncate text-[10px] text-muted font-mono">
                  aws-eu-west-2 • Live
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
