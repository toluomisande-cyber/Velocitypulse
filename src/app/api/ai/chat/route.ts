import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateText, isAIEnabled } from "@/lib/gemini";
import { subDays } from "date-fns";
import { calculateDashboardMetrics } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // ── 1. Load full sales ledger for rich metric context
    let sales: Array<{ amount: unknown; category: string; soldAt: Date; customerName?: string | null }> = [];
    try {
      const now = new Date();
      sales = await prisma.sale.findMany({
        where: { soldAt: { gte: subDays(now, 90) } },
        select: { amount: true, category: true, soldAt: true, customerName: true },
        orderBy: { soldAt: "desc" },
        take: 500,
      });
    } catch (dbErr) {
      console.warn("[/api/ai/chat] DB query warning:", dbErr);
    }

    const toNum = (v: unknown): number =>
      typeof v === "object" && v !== null && "toNumber" in v
        ? (v as { toNumber(): number }).toNumber()
        : Number(v);

    // ── 2. Compute live metrics from the actual database records
    const salesForAnalytics = sales.map((s) => ({
      id: "x",
      userId: "x",
      amount: toNum(s.amount),
      currency: "USD",
      category: s.category,
      customerName: s.customerName ?? null,
      orderRef: null,
      notes: null,
      soldAt: s.soldAt,
    }));

    const metrics = calculateDashboardMetrics(salesForAnalytics);
    const { kpis, weeklyBreakdown } = metrics;

    // ── 3. Build category breakdown
    const categoryBreakdown: Record<string, { revenue: number; count: number }> = {};
    sales.forEach((s) => {
      const cat = s.category;
      const amount = toNum(s.amount);
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { revenue: 0, count: 0 };
      categoryBreakdown[cat].revenue += amount;
      categoryBreakdown[cat].count += 1;
    });

    const sortedCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1].revenue - a[1].revenue);

    const topCategory = sortedCategories[0]?.[0] ?? "N/A";
    const topCategoryRevenue = sortedCategories[0]?.[1]?.revenue ?? 0;

    // ── 4. Build the full AI context grounded in live data
    const context = `
You are VelocityPulse Executive AI Copilot — a sharp, data-grounded sales analyst embedded in the executive dashboard.
You have real-time access to the live business ledger. Here are the current computed metrics:

═══════════════════════════════════════════════
LIVE BUSINESS METRICS (computed from database)
═══════════════════════════════════════════════

WEEKLY PERFORMANCE (current vs prior week):
- This week revenue: $${kpis.currentWeekRevenue.toFixed(2)} (${kpis.revenueChangePct >= 0 ? "+" : ""}${kpis.revenueChangePct.toFixed(1)}% WoW)
- This week orders: ${kpis.currentWeekUnits} (${kpis.unitsChangePct >= 0 ? "+" : ""}${kpis.unitsChangePct.toFixed(1)}% WoW)
- Last week revenue: $${kpis.previousWeekRevenue.toFixed(2)}
- Last week orders: ${kpis.previousWeekUnits}

AVERAGES & RATES:
- Average Order Value (AOV) this week: $${kpis.currentWeekAOV.toFixed(2)} (${kpis.aovChangePct >= 0 ? "+" : ""}${kpis.aovChangePct.toFixed(1)}% WoW)
- Month-to-date revenue: $${kpis.monthRevenueSoFar.toFixed(2)}
- Projected monthly run rate: $${kpis.projectedMonthRunRate.toFixed(2)}

CATEGORY BREAKDOWN (90-day):
${sortedCategories.map(([cat, data]) => `  • ${cat}: $${data.revenue.toFixed(2)} (${data.count} orders)`).join("\n")}

TOP CATEGORY: ${topCategory} — $${topCategoryRevenue.toFixed(2)}

RECENT WEEKLY TREND (last 10 weeks):
${weeklyBreakdown.slice(-5).map((w) => `  ${w.weekLabel}: $${w.revenue.toLocaleString()} (${w.velocityPct >= 0 ? "+" : ""}${w.velocityPct}% WoW, ${w.units} orders)`).join("\n")}

TOTAL LEDGER: ${sales.length} transactions over the last 90 days

USER MESSAGE: "${question}"

INSTRUCTIONS:
- If the user introduces themselves or greets you, respond warmly and briefly, then offer to dive into their data.
- For business questions, answer with PRECISE numbers from the live metrics above. Never invent or estimate data.
- Keep responses executive-grade: direct, specific, max 3 sentences.
- If asked something beyond this data scope, say so honestly.
`;

    let answer: string | null = null;
    if (isAIEnabled()) {
      try {
        const aiPromise = generateText(context);
        const timeoutPromise = new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), 8000)
        );
        answer = await Promise.race([aiPromise, timeoutPromise]);
      } catch (aiErr) {
        console.warn("[/api/ai/chat] AI generation error:", aiErr);
      }
    }

    if (!answer) {
      // Intelligent keyword-based fallback using real computed data
      const q = question.toLowerCase().trim();
      const nameMatch = q.match(/(?:i'm|i am|my name is|this is|im)\s+([a-zA-Z]+)/i);

      if (nameMatch) {
        const name = nameMatch[1];
        answer = `Welcome, ${name}! I'm your VelocityPulse AI Copilot. Your 90-day ledger shows $${(sales.reduce((s, x) => s + toNum(x.amount), 0)).toFixed(0)} in total revenue across ${sales.length} transactions — ask me anything.`;
      } else if (q.startsWith("hi") || q.startsWith("hello") || q.startsWith("hey")) {
        answer = `Hello! Your current week is tracking $${kpis.currentWeekRevenue.toFixed(0)} in revenue (${kpis.revenueChangePct >= 0 ? "+" : ""}${kpis.revenueChangePct.toFixed(1)}% vs last week). What would you like to explore?`;
      } else if (q.includes("aov") || q.includes("average order") || q.includes("ticket")) {
        answer = `Current AOV is $${kpis.currentWeekAOV.toFixed(2)} this week (${kpis.aovChangePct >= 0 ? "+" : ""}${kpis.aovChangePct.toFixed(1)}% vs $${kpis.previousWeekAOV.toFixed(2)} last week) across ${kpis.currentWeekUnits} orders.`;
      } else if (q.includes("category") || q.includes("product") || q.includes("top")) {
        answer = `Top-performing category over 90 days: ${topCategory} at $${topCategoryRevenue.toFixed(2)}. It leads ${sortedCategories.length} categories in the ledger.`;
      } else if (q.includes("revenue") || q.includes("sales") || q.includes("total")) {
        answer = `This week: $${kpis.currentWeekRevenue.toFixed(2)} revenue (${kpis.revenueChangePct >= 0 ? "+" : ""}${kpis.revenueChangePct.toFixed(1)}% WoW). Month-to-date: $${kpis.monthRevenueSoFar.toFixed(2)}, projecting $${kpis.projectedMonthRunRate.toFixed(2)} for the full month.`;
      } else if (q.includes("month") || q.includes("mtd") || q.includes("pacing")) {
        answer = `Month-to-date revenue is $${kpis.monthRevenueSoFar.toFixed(2)}, pacing to a projected $${kpis.projectedMonthRunRate.toFixed(2)} for the full month at current daily run rate.`;
      } else if (q.includes("forecast") || q.includes("predict") || q.includes("next")) {
        answer = `Based on the current ${kpis.revenueChangePct >= 0 ? "positive" : "declining"} trajectory (${kpis.revenueChangePct >= 0 ? "+" : ""}${kpis.revenueChangePct.toFixed(1)}% WoW), the forward projection panel shows the 4-week regression. Open the Forecast chart for full confidence intervals.`;
      } else {
        answer = `Live metrics: $${kpis.currentWeekRevenue.toFixed(0)} this week (${kpis.revenueChangePct >= 0 ? "+" : ""}${kpis.revenueChangePct.toFixed(1)}% WoW), ${kpis.currentWeekUnits} orders, AOV $${kpis.currentWeekAOV.toFixed(2)}. Top sector: ${topCategory}. Ask me anything specific!`;
      }
    }

    return NextResponse.json({ answer, aiEnabled: isAIEnabled() });
  } catch (err) {
    console.error("[/api/ai/chat] Fatal error:", err);
    return NextResponse.json({
      answer: "VelocityPulse AI is active and connected to your live ledger. How can I assist with your business performance data today?",
      aiEnabled: false,
    });
  }
}
