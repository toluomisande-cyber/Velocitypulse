"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ClaudeMark } from "@/components/ui/claude-mark";
import { Plus, UploadCloud, RefreshCw, LogOut, Menu } from "lucide-react";

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
  const businessName = session?.user?.name || "VelocityPulse Workspace";
  const userEmail = session?.user?.email || "admin@velocitypulse.io";

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-[#e5e1d8] bg-[#f7f5f0]/95 px-6 md:px-8 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-[#7f7b73] hover:bg-[#eae6dc] hover:text-[#191816] md:hidden transition-colors"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffffff] border border-[#e5e1d8] text-[#191816]">
            <ClaudeMark className="h-4 w-4 text-[#c26a50]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-base font-normal tracking-tight text-[#191816]">
                {businessName}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono text-[#2e7d52] bg-[#2e7d52]/10 border border-[#2e7d52]/20">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2e7d52]" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-[#7f7b73] hidden sm:block">
              Weekly revenue velocity & transaction tracking
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 text-xs font-normal border-[#e5e1d8] bg-white text-[#5a5751] hover:text-[#191816] hover:bg-[#faf9f5]"
          title="Refresh metrics"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 sm:mr-1.5 ${isRefreshing ? "animate-spin text-[#c26a50]" : "text-[#7f7b73]"}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCsvUpload}
          className="h-8 text-xs font-normal border-[#e5e1d8] bg-white text-[#5a5751] hover:text-[#191816] hover:bg-[#faf9f5]"
        >
          <UploadCloud className="h-3.5 w-3.5 sm:mr-1.5 text-[#7f7b73]" />
          <span className="hidden sm:inline">Import CSV</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onOpenNewSale}
          className="h-8 text-xs font-medium bg-[#c26a50] hover:bg-[#a85840] text-white"
        >
          <Plus className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Record sale</span>
        </Button>

        <div className="h-4 w-px bg-[#e5e1d8] mx-0.5 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-medium text-[#191816] leading-tight">
              {businessName}
            </span>
            <span className="text-[11px] text-[#7f7b73] font-mono">{userEmail}</span>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#7f7b73] hover:text-[#b33a3a] hover:bg-[#eae6dc] transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
