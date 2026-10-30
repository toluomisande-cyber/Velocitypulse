import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText, isAIEnabled } from "@/lib/gemini";
import { subDays } from "date-fns";
import { calculateDashboardMetrics } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question } = await req.json();
    if (!question || typeof question !== "string") {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    // 1. Fetch THIS tenant's actual transactions
    const sales = await prisma.sale.findMany({
      where: {
        userId,
        soldAt: { gte: subDays(new Date(), 90) },
      },
      select: { amount: true, category: true, soldAt: true, customerName: true },
      orderBy: { soldAt: "desc" },
      take: 500,
    });

    const toNum = (v: unknown): number =>
      typeof v === "object" && v !== null && "toNumber" in v
        ? (v as { toNumber(): number }).toNumber()
        : Number(v);

    // 2. Handle Zero-State for new tenants with no records
    if (sales.length === 0) {
      const q = question.toLowerCase();
      if (q.startsWith("hi") || q.startsWith("hello") || q.includes("who are you") || q.includes("david") || q.includes("name")) {
        return NextResponse.json({
          answer: "Hello! I am your VelocityPulse AI Analyst. Your account currently has 0 recorded transactions. Import a sales CSV or log a sale to begin analyzing revenue patterns and trends.",
          aiEnabled: isAIEnabled(),
        });
      }
      return NextResponse.json({
        answer: "Your ledger is currently empty with 0 recorded transactions. Import your sales CSV or record a sale via the header button to generate analytics and velocity intelligence.",
        aiEnabled: isAIEnabled(),
      });
    }

    // 3. Compute real metrics on THIS tenant's data
    const salesForAnalytics = sales.map((s) => ({
      id: "x",
      userId,
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

    const categoryBreakdown: Record<string, { revenue: number; count: number }> = {};
    sales.forEach((s) => {
      const cat = s.category;
      const amount = toNum(s.amount);
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { revenue: 0, count: 0 };
      categoryBreakdown[cat].revenue += amount;
      categoryBreakdown[cat].count += 1;
    });

    const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1].revenue - a[1].revenue);
    const topCategory = sortedCategories[0]?.[0] ?? "N/A";
    const topCategoryRevenue = sortedCategories[0]?.[1]?.revenue ?? 0;

    const totalLedgerRevenue = sales.reduce((sum, s) => sum + toNum(s.amount), 0);

    const context = `
You are VelocityPulse AI Copilot. You are analyzing this authenticated user's real business data:

USER METRICS SUMMARY:
- Total transactions in ledger: ${sales.length}
- Total ledger revenue (90-day): $${totalLedgerRevenue.toFixed(2)}
- Current week revenue: $${kpis.currentWeekRevenue.toFixed(2)} (${kpis.previousWeekRevenue > 0 ? `${kpis.revenueChangePct >= 0 ? "+" : ""}${kpis.revenueChangePct.toFixed(1)}% WoW` : "no prior baseline"})
- Current week orders: ${kpis.currentWeekUnits} (prior week: ${kpis.previousWeekUnits})
- Average Order Value: $${kpis.currentWeekAOV.toFixed(2)}
- Month-to-date revenue: $${kpis.monthRevenueSoFar.toFixed(2)}
- Projected month run rate: $${kpis.projectedMonthRunRate.toFixed(2)}
- Leading category: ${topCategory} ($${topCategoryRevenue.toFixed(2)})
- Category breakdown:
${sortedCategories.map(([cat, d]) => `  • ${cat}: $${d.revenue.toFixed(2)} (${d.count} orders)`).join("\n")}

USER QUESTION: "${question}"

INSTRUCTIONS:
- Ground all facts strictly in the numbers above.
- Never output demo numbers, mock data, or imaginary metrics.
- Keep responses executive-ready, direct, and concise (1-3 sentences max).
`;

    let answer: string | null = null;
    if (isAIEnabled()) {
      try {
        const aiPromise = generateText(context);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 8000));
        answer = await Promise.race([aiPromise, timeoutPromise]);
      } catch (aiErr) {
        console.warn("[/api/ai/chat] AI error:", aiErr);
      }
    }

    if (!answer) {
      // Dynamic fallback calculated from this user's data
      const q = question.toLowerCase().trim();
      if (q.includes("category") || q.includes("product") || q.includes("top")) {
        answer = `Your top category is ${topCategory}, generating $${topCategoryRevenue.toFixed(2)} across transactions in your ledger.`;
      } else if (q.includes("aov") || q.includes("average order")) {
        answer = `Your current Average Order Value is $${kpis.currentWeekAOV.toFixed(2)} across ${kpis.currentWeekUnits} orders placed this cycle.`;
      } else if (q.includes("revenue") || q.includes("sales") || q.includes("total")) {
        answer = `Current week revenue is $${kpis.currentWeekRevenue.toFixed(2)} (${kpis.currentWeekUnits} orders). Total 90-day ledger revenue is $${totalLedgerRevenue.toFixed(2)} across ${sales.length} transactions.`;
      } else {
        answer = `Live metrics for your organization: $${kpis.currentWeekRevenue.toFixed(2)} revenue this week across ${kpis.currentWeekUnits} orders (AOV $${kpis.currentWeekAOV.toFixed(2)}). Total recorded ledger: ${sales.length} sales.`;
      }
    }

    return NextResponse.json({ answer, aiEnabled: isAIEnabled() });
  } catch (err) {
    console.error("[/api/ai/chat] Fatal error:", err);
    return NextResponse.json({
      answer: "VelocityPulse AI Copilot is active and connected to your tenant ledger.",
      aiEnabled: false,
    });
  }
}
