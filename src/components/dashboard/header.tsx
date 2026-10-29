"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClaudeMark } from "@/components/ui/claude-mark";
import {
  PlusCircle,
  UploadCloud,
  RefreshCw,
  LogOut,
  Building2,
  Menu,
} from "lucide-react";

interface HeaderProps {
  onOpenNewSale: () => void;
  onOpenCsvUpload: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export function Header({
  onOpenNewSale,
  onOpenCsvUpload,
  onRefresh,
  isRefreshing,
  onToggleSidebar,
}: HeaderProps) {
  const { data: session } = useSession();
  const businessName = session?.user?.name || "Apex Commerce Group";
  const userEmail = session?.user?.email || "admin@velocitypulse.io";

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-hairline bg-canvas/90 px-4 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-2 text-muted hover:bg-surface-soft hover:text-ink md:hidden transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-card border border-hairline text-ink">
            <ClaudeMark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-normal tracking-tight text-ink flex items-center gap-1.5">
                {businessName}
              </h1>
              <Badge variant="coral" className="py-0 px-2 hidden sm:inline-flex">
                LIVE
              </Badge>
            </div>
            <p className="text-[11px] text-muted hidden sm:block font-sans">
              Weekly Sales Velocity & Revenue Engine
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-body font-medium"
          title="Refresh Metrics"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 sm:mr-1.5 ${isRefreshing ? "animate-spin text-primary" : "text-muted"}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCsvUpload}
          className="text-body font-medium"
        >
          <UploadCloud className="h-3.5 w-3.5 sm:mr-1.5 text-muted" />
          <span className="hidden sm:inline">Import CSV</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onOpenNewSale}
          className="font-medium bg-primary hover:bg-primary-active text-on-primary"
        >
          <PlusCircle className="h-4 w-4 sm:mr-1.5" />
          <span className="hidden sm:inline">New Sale</span>
        </Button>

        <div className="h-5 w-px bg-hairline mx-1 hidden sm:block" />

        <div className="flex items-center gap-2 pl-1">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-medium text-ink leading-tight">
              {businessName}
            </span>
            <span className="text-[11px] text-muted-soft">{userEmail}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-muted hover:text-error hover:bg-surface-soft h-8 w-8"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
