import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText, isAIEnabled } from "@/lib/gemini";
import { subDays } from "date-fns";
import { calculateDashboardMetrics } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InsightItem {
  type: "positive" | "warning" | "neutral" | "action";
  headline: string;
  body: string;
}

function extractJSON(raw: string): InsightItem[] | null {
  try {
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {}

  try {
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      const parsed = JSON.parse(fenceMatch[1].trim());
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  try {
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start !== -1 && end > start) {
      const substr = raw.substring(start, end + 1);
      const parsed = JSON.parse(substr);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
      where: {
        userId,
        soldAt: { gte: subDays(new Date(), 90) },
      },
      select: { amount: true, category: true, soldAt: true },
      orderBy: { soldAt: "desc" },
    });

    // Zero-State: User has not imported sales yet
    if (sales.length === 0) {
      return NextResponse.json({
        insights: [
          {
            type: "action",
            headline: "Import Sales Data to Begin",
            body: "Your ledger has 0 records. Import your CSV data or record your first sale to activate automated AI pattern insights.",
          },
        ],
        aiEnabled: isAIEnabled(),
        isZeroState: true,
      });
    }

    const toNum = (v: unknown): number =>
      typeof v === "object" && v !== null && "toNumber" in v
        ? (v as { toNumber(): number }).toNumber()
        : Number(v);

    const salesForAnalytics = sales.map((s) => ({
      id: "x",
      userId,
      amount: toNum(s.amount),
      currency: "USD",
      category: s.category,
      customerName: null,
      orderRef: null,
      notes: null,
      soldAt: s.soldAt,
    }));

    const metrics = calculateDashboardMetrics(salesForAnalytics);
    const { kpis, dailyVelocity, weeklyBreakdown } = metrics;

    const currentWeekRevenue = kpis.currentWeekRevenue;
    const previousWeekRevenue = kpis.previousWeekRevenue;
    const revenueChangePct = kpis.revenueChangePct;
    const currentWeekUnits = kpis.currentWeekUnits;
    const currentWeekAOV = kpis.currentWeekAOV;
    const aovChangePct = kpis.aovChangePct;

    const categoryTotals: Record<string, number> = {};
    sales.forEach((s) => {
      categoryTotals[s.category] = (categoryTotals[s.category] ?? 0) + toNum(s.amount);
    });
    const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCats[0]?.[0] ?? "Direct Sales";
    const topCategoryRevenue = sortedCats[0]?.[1] ?? 0;

    const dailyBreakdown = dailyVelocity.map((d) => ({
      day: d.dayShort,
      revenue: d.currentWeek,
    }));

    const peakDay = dailyBreakdown.reduce(
      (max, d) => (d.revenue > max.revenue ? d : max),
      dailyBreakdown[0] || { day: "Mon", revenue: 0 }
    );

    const dynamicFallbackInsights: InsightItem[] = [
      {
        type: revenueChangePct >= 0 ? "positive" : "warning",
        headline: previousWeekRevenue > 0
          ? (revenueChangePct >= 0 ? "Weekly Revenue Expansion" : "Weekly Velocity Contraction")
          : "Initial Revenue Cycle",
        body: previousWeekRevenue > 0
          ? (revenueChangePct >= 0
              ? `Revenue expanded by +${revenueChangePct.toFixed(1)}% this week to $${currentWeekRevenue.toLocaleString()} compared to $${previousWeekRevenue.toLocaleString()} prior week.`
              : `Revenue declined by ${revenueChangePct.toFixed(1)}% this week ($${currentWeekRevenue.toLocaleString()} vs $${previousWeekRevenue.toLocaleString()} prior week).`)
          : `Recorded $${currentWeekRevenue.toLocaleString()} in revenue across ${currentWeekUnits} orders during this initial cycle.`,
      },
      {
        type: aovChangePct >= 0 ? "positive" : "neutral",
        headline: "Average Order Value",
        body: `Average Order Value is $${currentWeekAOV.toFixed(2)} across ${currentWeekUnits} orders placed this cycle.`,
      },
      {
        type: "neutral",
        headline: `${topCategory} Performance`,
        body: `${topCategory} accounts for $${topCategoryRevenue.toLocaleString()} in volume across recorded transactions.`,
      },
      {
        type: "action",
        headline: `${peakDay.day} Peak Pacing`,
        body: `${peakDay.day} registered highest activity this week with $${peakDay.revenue.toLocaleString()} in sales.`,
      },
    ];

    if (!isAIEnabled()) {
      return NextResponse.json({ insights: dynamicFallbackInsights, aiEnabled: false });
    }

    const prompt = `You are a sales analyst AI. Analyze this user's verified ledger data and return 4 factual insights:
- This week revenue: $${currentWeekRevenue.toFixed(2)} vs prior week $${previousWeekRevenue.toFixed(2)} (${previousWeekRevenue > 0 ? `${revenueChangePct.toFixed(1)}% WoW` : "no prior baseline"})
- Orders: ${currentWeekUnits} this week
- AOV: $${currentWeekAOV.toFixed(2)}
- Top Category: ${topCategory} ($${topCategoryRevenue.toFixed(2)})
- Peak day: ${peakDay.day} ($${peakDay.revenue.toFixed(0)})

Return ONLY a JSON array with 4 items:
[{"type":"positive"|"warning"|"neutral"|"action","headline":"title","body":"factual insight using real numbers"}]
No markdown wrappers, no intro text.`;

    let raw: string | null = null;
    try {
      const aiPromise = generateText(prompt);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 7000));
      raw = await Promise.race([aiPromise, timeoutPromise]);
    } catch (err) {
      console.warn("[/api/ai/insights] AI error:", err);
    }

    if (raw) {
      const parsed = extractJSON(raw);
      if (parsed && parsed.length >= 3) {
        return NextResponse.json({ insights: parsed, aiEnabled: true });
      }
    }

    return NextResponse.json({ insights: dynamicFallbackInsights, aiEnabled: true });
  } catch (err) {
    console.error("[/api/ai/insights] Error:", err);
    return NextResponse.json({
      insights: [
        {
          type: "neutral",
          headline: "Database Connected",
          body: "Your isolated tenant ledger is live and synchronized with Neon PostgreSQL.",
        },
      ],
      aiEnabled: false,
    });
  }
}
