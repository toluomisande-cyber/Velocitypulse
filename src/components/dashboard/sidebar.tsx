"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { id: "overview", label: "Overview", href: "/overview", icon: LayoutDashboard },
  { id: "ai", label: "Intelligence digest", href: "/intelligence", icon: Brain },
  { id: "velocity", label: "Sales velocity", href: "/velocity", icon: Activity },
  { id: "trends", label: "Weekly breakdown", href: "/trends", icon: TrendingUp },
  { id: "transactions", label: "Sales ledger", href: "/transactions", icon: Receipt },
  { id: "ingestion", label: "CSV imports", href: "/ingestion", icon: FileSpreadsheet },
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

  const handleNavClick = (e: React.MouseEvent, item: typeof navItems[0]) => {
    onCloseMobile();

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
          className="fixed inset-0 z-40 bg-[#191816]/40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex flex-col border-r border-[#e5e1d8] bg-[#f7f5f0] transition-all duration-200",
          "md:sticky md:top-0 md:z-30 md:h-screen md:self-start md:overflow-y-auto",
          mobileOpen ? "translate-x-0 w-64 h-full" : "-translate-x-full md:translate-x-0",
          isCollapsed ? "md:w-18" : "md:w-64"
        )}
      >
        {/* Brand Section */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e5e1d8] px-4">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-[#e5e1d8] transition-colors">
              <ClaudeMark className="h-4 w-4 text-[#c26a50]" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="truncate font-serif text-sm font-normal tracking-tight text-[#191816]">
                  VelocityPulse
                </span>
                <span className="truncate text-[10px] text-[#7f7b73] font-mono">
                  SaaS analytics
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={onToggleCollapse}
            className="hidden md:flex h-6 w-6 items-center justify-center rounded-md text-[#7f7b73] hover:bg-[#eae6dc] hover:text-[#191816] transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[11px] font-medium text-[#7f7b73]">
              Workspace
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
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-normal transition-colors",
                  isActive
                    ? "bg-white text-[#191816] font-medium border border-[#e5e1d8] shadow-xs"
                    : "text-[#5a5751] hover:bg-[#eae6dc]/60 hover:text-[#191816]"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-[#c26a50]" : "text-[#7f7b73] group-hover:text-[#191816]"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate text-left">{item.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c26a50] shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom system status */}
        <div className="shrink-0 border-t border-[#e5e1d8] p-3">
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border border-[#e5e1d8] bg-white p-2.5",
              isCollapsed ? "justify-center" : ""
            )}
          >
            <span className="h-2 w-2 rounded-full bg-[#2e7d52] shrink-0" />
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="truncate text-xs font-medium text-[#191816]">
                  Postgres connected
                </p>
                <p className="truncate text-[10px] text-[#7f7b73] font-mono">
                  Tenant isolated
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
