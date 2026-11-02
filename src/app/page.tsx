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
import { ImportsManager } from "@/components/dashboard/imports-manager";
import { KPISummary, DailyVelocityPoint, WeeklyBarPoint, VelocityGaugeData } from "@/lib/analytics";
import { UploadCloud, Plus } from "lucide-react";

export default function DashboardPage({ defaultTab = "overview" }: { defaultTab?: string }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [dailyVelocity, setDailyVelocity] = useState<DailyVelocityPoint[]>([]);
  const [weeklyBreakdown, setWeeklyBreakdown] = useState<WeeklyBarPoint[]>([]);
  const [velocityGauge, setVelocityGauge] = useState<VelocityGaugeData | null>(null);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);

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
        setTotalTransactions(json.data.totalTransactions || 0);
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

  const isZeroState = !loading && totalTransactions === 0;

  return (
    <div className="flex min-h-screen bg-[#f7f5f0] text-[#191816] font-sans antialiased" style={{ scrollBehavior: "smooth" }}>
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

        <main className="flex-1 pb-16 space-y-8 md:space-y-10">

          {/* ── 1. Hero Overview */}
          <section id="section-overview" className="max-w-7xl mx-auto w-full px-6 md:px-8 pt-6">
            <HeroBand
              revenue={kpis?.currentWeekRevenue ?? 0}
              changePct={kpis?.revenueChangePct ?? 0}
              onOpenChat={() => setIsChatOpen(true)}
              onOpenImport={() => setIsCsvUploadOpen(true)}
              kpis={kpis}
              totalTransactions={totalTransactions}
            />
          </section>

          {/* ── ZERO STATE (Shown when account has 0 data) */}
          {isZeroState && (
            <section className="max-w-7xl mx-auto w-full px-6 md:px-8">
              <div className="rounded-xl border border-[#e5e1d8] bg-white p-8 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#faf9f5] border border-[#e5e1d8] text-[#c26a50] flex items-center justify-center">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="font-serif text-xl font-normal text-[#191816]">Workspace initialized</h3>
                  <p className="text-xs text-[#5e554a] leading-relaxed">
                    Your sales ledger is ready. Import a CSV file or record a transaction to activate real-time sales velocity, KPI pace, and 4-week projections.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    onClick={() => setIsCsvUploadOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-[#c26a50] hover:bg-[#a85840] text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Import CSV file
                  </button>
                  <button
                    onClick={() => setIsNewSaleOpen(true)}
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-[#faf9f5] border border-[#e5e1d8] text-[#191816] text-xs font-normal px-3.5 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 text-[#c26a50]" />
                    Record sale
                  </button>
                  <a
                    href="/sample_sales_template.csv"
                    download
                    className="inline-flex items-center text-xs text-[#7f7b73] hover:text-[#191816] px-2 py-1 font-mono hover:underline"
                  >
                    Sample template ↓
                  </a>
                </div>
              </div>
            </section>
          )}

          {/* ── 2. Performance Snapshot */}
          <section className="max-w-7xl mx-auto w-full px-6 md:px-8">
            <div>
              <div className="mb-4">
                <p className="text-[11px] font-medium text-[#7f7b73] mb-0.5">
                  Performance snapshot
                </p>
                <h2 className="font-serif text-2xl font-normal text-[#191816] tracking-tight">
                  Weekly metrics
                </h2>
              </div>
              <KPICards kpis={kpis} isLoading={loading} onOpenImport={() => setIsCsvUploadOpen(true)} />
            </div>
          </section>

          {/* ── 3. Visual Analytics & Velocity */}
          <section id="section-velocity" className="max-w-7xl mx-auto w-full px-6 md:px-8">
            <div>
              <div className="mb-4">
                <p className="text-[11px] font-medium text-[#7f7b73] mb-0.5">
                  Visual pace
                </p>
                <h2 className="font-serif text-2xl font-normal text-[#191816] tracking-tight">
                  Sales velocity
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 mb-5">
                <div className="lg:col-span-2">
                  <WeeklyGrowthChart data={dailyVelocity} />
                </div>
                <div className="lg:col-span-1">
                  <VelocityGauge data={velocityGauge} />
                </div>
              </div>

              <div id="section-trends">
                <WoWBreakdownChart data={weeklyBreakdown} />
              </div>
            </div>
          </section>

          {/* ── 4. Intelligence Digest */}
          <section id="section-ai" className="max-w-7xl mx-auto w-full px-6 md:px-8">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-[#7b7266] mb-0.5">
                    Automated analysis
                  </p>
                  <h2 className="font-serif text-2xl font-normal text-[#191816] tracking-tight">
                    Intelligence digest
                  </h2>
                </div>
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#c26a50] hover:text-[#a85840] font-medium"
                >
                  Query assistant →
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-3">
                  <AIInsightsPanel />
                </div>
                <div className="lg:col-span-2">
                  <AIForecastPanel />
                </div>
              </div>
            </div>
          </section>

          {/* ── 5. Transaction Ledger */}
          <section id="section-transactions" className="max-w-7xl mx-auto w-full px-6 md:px-8">
            <div>
              <SalesDataTable refreshTrigger={refreshTrigger} />
            </div>
          </section>

          {/* ── 6. CSV Batch Ingestion History */}
          <section id="section-ingestion" className="max-w-7xl mx-auto w-full px-6 md:px-8">
            <div>
              <ImportsManager
                onImportDeleted={handleDataUpdated}
                onOpenUpload={() => setIsCsvUploadOpen(true)}
                refreshTrigger={refreshTrigger}
              />
            </div>
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
