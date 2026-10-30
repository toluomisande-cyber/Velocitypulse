"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Activity,
  Brain,
} from "lucide-react";
import { ClaudeMark } from "@/components/ui/claude-mark";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const navItems = [
  { id: "overview", label: "Dashboard Overview", href: "/overview", icon: LayoutDashboard },
  { id: "ai", label: "AI Intelligence", href: "/intelligence", icon: Brain },
  { id: "velocity", label: "Weekly Sales Velocity", href: "/velocity", icon: Activity },
  { id: "trends", label: "WoW Revenue Trends", href: "/trends", icon: TrendingUp },
  { id: "transactions", label: "Sales Log & Table", href: "/transactions", icon: Receipt },
  { id: "ingestion", label: "Data Ingestion (CSV)", href: "/ingestion", icon: FileSpreadsheet },
];

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
  activeTab = "overview",
  onSelectTab,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    onCloseMobile();

    // If on the root dashboard page, smooth scroll to section
    if (pathname === "/" || pathname === item.href) {
      if (onSelectTab) onSelectTab(item.id);
      const el = document.getElementById(`section-${item.id}`);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar container — sticky on desktop, fixed slide-in on mobile */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex flex-col border-r border-hairline bg-surface-soft transition-all duration-300",
          "md:sticky md:top-0 md:z-30 md:h-screen md:self-start md:overflow-y-auto",
          mobileOpen ? "translate-x-0 w-64 h-full" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-20" : "md:w-64"
        )}
      >
        {/* Brand / Logo Section */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-hairline px-4 bg-canvas/60">
          <Link href="/" className="flex items-center gap-3 overflow-hidden group">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-canvas border border-hairline shadow-subtle group-hover:border-primary/50 transition-colors">
              <ClaudeMark className="h-5 w-5 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-serif text-base font-normal tracking-tight text-ink">
                  VelocityPulse
                </span>
                <span className="truncate text-[10px] text-muted font-sans">
                  SaaS Analytics Suite
                </span>
              </div>
            )}
          </Link>

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
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-soft">
              Analytics & Tracking
            </p>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              pathname === item.href ||
              (item.id === "overview" && pathname === "/");

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
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
                {isActive && !isCollapsed && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom system status indicator */}
        <div className="shrink-0 border-t border-hairline p-3 bg-canvas/40">
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
                  Multi-Tenant Tenant Isolation
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
