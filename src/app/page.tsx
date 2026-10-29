"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { WeeklyGrowthChart } from "@/components/dashboard/weekly-growth-chart";
import { WoWBreakdownChart } from "@/components/dashboard/wow-breakdown-chart";
import { VelocityGauge } from "@/components/dashboard/velocity-gauge";
import { SalesDataTable } from "@/components/dashboard/sales-data-table";
import { NewSaleModal } from "@/components/dashboard/new-sale-modal";
import { CsvUploadDropzone } from "@/components/dashboard/csv-upload-dropzone";
import { AIInsightsPanel } from "@/components/dashboard/ai-insights-panel";
import { AIForecastPanel } from "@/components/dashboard/ai-forecast-panel";
import { AIChatDrawer } from "@/components/dashboard/ai-chat-drawer";
import { HeroBand } from "@/components/dashboard/hero-band";
import { KPISummary, DailyVelocityPoint, WeeklyBarPoint, VelocityGaugeData } from "@/lib/analytics";

export default function DashboardPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [dailyVelocity, setDailyVelocity] = useState<DailyVelocityPoint[]>([]);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState<WeeklyBarPoint[]>([]);
  const [velocityGauge, setVelocityGauge] = useState<VelocityGaugeData | null>(null);

  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [isCsvUploadOpen, setIsCsvUploadOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/metrics");
      const json = await res.json();
      if (json.success && json.data) {
        setKpis(json.data.kpis);
        setDailyVelocity(json.data.dailyVelocity);
        setWeeklyBreakdown(json.data.weeklyBreakdown);
        setVelocityGauge(json.data.velocityGauge);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshTrigger]);

  const handleDataUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-[#faf9f5] text-[#141413] font-sans antialiased">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        <Header
          onOpenNewSale={() => setIsNewSaleOpen(true)}
          onOpenCsvUpload={() => setIsCsvUploadOpen(true)}
          onRefresh={fetchDashboardData}
          isRefreshing={isRefreshing}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          sidebarOpen={mobileSidebarOpen}
        />

        <main className="flex-1 space-y-0">

          {/* ── BAND 1: Hero (dark navy) ───────────────────────────── */}
          <section className="px-5 pt-6 pb-8 md:px-8 lg:px-10">
            <HeroBand
              revenue={kpis?.currentWeekRevenue ?? 0}
              changePct={kpis?.revenueChangePct ?? 0}
              onOpenChat={() => setIsChatOpen(true)}
            />
          </section>

          {/* ── BAND 2: KPI Numbers (cream canvas) ────────────────── */}
          <section className="px-5 pb-10 md:px-8 lg:px-10 max-w-7xl mx-auto w-full">
            <div className="mb-5">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8e8b82] mb-1">
                Performance Snapshot
              </p>
              <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#141413] tracking-tight relative inline-block">
                Weekly Metrics
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-[#cc785c] to-transparent" />
              </h2>
            </div>
            <KPICards kpis={kpis} isLoading={loading} />
          </section>

          {/* ── BAND 3: AI Intelligence (dark navy full-bleed) ────── */}
          <section className="bg-[#0f0e0d] border-t border-b border-[#252320] py-10 px-5 md:px-8 lg:px-10">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6c6a64] mb-1">
                    Real-Time Velocity AI · Live Analysis
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#faf9f5] tracking-tight">
                    Intelligence Layer
                  </h2>
                </div>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="hidden md:flex items-center gap-2 bg-[#cc785c] hover:bg-[#a9583e] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Ask Your Data →
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* AI Insights — wider */}
                <div className="lg:col-span-3">
                  <AIInsightsPanel />
                </div>
                {/* AI Forecast — narrower */}
                <div className="lg:col-span-2">
                  <AIForecastPanel />
                </div>
              </div>
            </div>
          </section>

          {/* ── BAND 4: Charts (cream) ────────────────────────────── */}
          <section className="px-5 py-10 md:px-8 lg:px-10 max-w-7xl mx-auto w-full">
            <div className="mb-6">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8e8b82] mb-1">
                Visual Analytics
              </p>
              <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#141413] tracking-tight relative inline-block">
                Sales Velocity Charts
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-[#cc785c] to-transparent" />
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-6">
              <div className="lg:col-span-2">
                <WeeklyGrowthChart data={dailyVelocity} />
              </div>
              <div className="lg:col-span-1">
                <VelocityGauge data={velocityGauge} />
              </div>
            </div>

            <WoWBreakdownChart data={weeklyBreakdown} />
          </section>

          {/* ── BAND 5: Data Table (surface-soft) ─────────────────── */}
          <section className="bg-[#f5f0e8] border-t border-[#e6dfd8] px-5 py-10 md:px-8 lg:px-10">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8e8b82] mb-1">
                  Transaction Log
                </p>
                <h2 className="font-serif text-2xl md:text-3xl font-normal text-[#141413] tracking-tight relative inline-block">
                  Sales History
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-[#cc785c] to-transparent" />
                </h2>
              </div>
              <SalesDataTable refreshTrigger={refreshTrigger} />
            </div>
          </section>

          {/* ── BAND 6: CTA Footer (dark navy) ────────────────────── */}
          <section className="bg-[#181715] border-t border-[#252320] px-5 py-12 md:px-8 lg:px-10 text-center">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#6c6a64] mb-3">
              Sales Intelligence Platform
            </p>
            <h3 className="font-serif text-2xl md:text-4xl font-normal text-[#faf9f5] tracking-tight mb-4">
              Every transaction tells a story.
            </h3>
            <p className="text-sm text-[#6c6a64] font-mono max-w-md mx-auto mb-6">
              Powered by Neon PostgreSQL · Next.js 15 App Router · Prisma ORM · Real-Time AI Engine
            </p>
            <button
              onClick={() => setIsNewSaleOpen(true)}
              className="inline-flex items-center gap-2 bg-[#cc785c] hover:bg-[#a9583e] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              Record a Sale
            </button>
          </section>

        </main>
      </div>

      {/* Modals & Drawers */}
      <NewSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        onSuccess={handleDataUpdated}
      />
      <CsvUploadDropzone
        isOpen={isCsvUploadOpen}
        onClose={() => setIsCsvUploadOpen(false)}
        onSuccess={handleDataUpdated}
      />
      <AIChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}
