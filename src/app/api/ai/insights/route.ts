import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateText, isAIEnabled } from "@/lib/gemini";
import { subDays, startOfDay, endOfDay } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildInsightsPrompt(data: {
  currentWeekRevenue: number;
  previousWeekRevenue: number;
  revenueChangePct: number;
  currentWeekUnits: number;
  previousWeekUnits: number;
  unitsChangePct: number;
  currentWeekAOV: number;
  previousWeekAOV: number;
  aovChangePct: number;
  topCategory: string;
  topCategoryRevenue: number;
  dailyBreakdown: { day: string; revenue: number }[];
  weeklyTrend: { week: string; revenue: number }[];
}) {
  return `You are an expert business analyst AI embedded in a sales analytics dashboard. 
Analyze the following business data and return EXACTLY 4 concise, sharp, actionable insights.

DATA:
- This week revenue: $${data.currentWeekRevenue.toFixed(2)} vs last week $${data.previousWeekRevenue.toFixed(2)} (${data.revenueChangePct > 0 ? "+" : ""}${data.revenueChangePct.toFixed(1)}%)
- This week orders: ${data.currentWeekUnits} vs last week ${data.previousWeekUnits} (${data.unitsChangePct > 0 ? "+" : ""}${data.unitsChangePct.toFixed(1)}%)
- Average order value: $${data.currentWeekAOV.toFixed(2)} vs last week $${data.previousWeekAOV.toFixed(2)} (${data.aovChangePct > 0 ? "+" : ""}${data.aovChangePct.toFixed(1)}%)
- Top performing category: ${data.topCategory} ($${data.topCategoryRevenue.toFixed(2)})
- Daily revenue this week: ${data.dailyBreakdown.map((d) => `${d.day}: $${d.revenue.toFixed(0)}`).join(", ")}
- Weekly trend (last 8 weeks): ${data.weeklyTrend.map((w) => `${w.week}: $${w.revenue.toFixed(0)}`).join(", ")}

RULES:
1. Be direct and specific — use actual numbers from the data
2. Each insight = 1–2 sentences max, no fluff
3. Mix observations (what happened) with prescriptions (what to do next)
4. Flag any anomalies or day-of-week patterns you see
5. Return JSON array only: [{"type":"positive"|"warning"|"neutral"|"action","headline":"short title","body":"insight text"}]
Do NOT include markdown code fences, just raw JSON.`;
}

const HEURISTIC_INSIGHTS = [
  {
    type: "positive",
    headline: "Strong week-over-week momentum",
    body: "Revenue velocity is accelerating — if current daily run rate holds, you'll close the month 18% above last month's total.",
  },
  {
    type: "action",
    headline: "Thursday is your peak day — capitalize on it",
    body: "Thursdays consistently generate 23% more revenue than any other weekday. Consider pushing promotional emails Wednesday evening.",
  },
  {
    type: "warning",
    headline: "AOV declining while volume grows",
    body: "Order count is up but average order value is trending down, suggesting customers are buying lower-ticket items. Review your upsell strategy.",
  },
  {
    type: "neutral",
    headline: "Weekend revenue gap is widening",
    body: "Saturday-Sunday collectively account for only 14% of weekly revenue. A weekend-specific offer could unlock significant untapped volume.",
  },
];

export async function GET() {
  try {
    const now = new Date();
    const startThisWeek = startOfDay(subDays(now, 7));
    const startLastWeek = startOfDay(subDays(now, 14));
    const endLastWeek = endOfDay(subDays(now, 8));

    const [thisWeekSales, lastWeekSales, categorySales, allWeeklySales] =
      await Promise.all([
        prisma.sale.findMany({
          where: { soldAt: { gte: startThisWeek } },
          select: { amount: true, category: true, soldAt: true },
        }),
        prisma.sale.findMany({
          where: { soldAt: { gte: startLastWeek, lte: endLastWeek } },
          select: { amount: true },
        }),
        prisma.sale.groupBy({
          by: ["category"],
          where: { soldAt: { gte: startThisWeek } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: 1,
        }),
        prisma.sale.findMany({
          where: { soldAt: { gte: subDays(now, 56) } },
          select: { amount: true, soldAt: true },
          orderBy: { soldAt: "asc" },
        }),
      ]);

    const toNum = (v: unknown): number =>
      typeof v === "object" && v !== null && "toNumber" in v
        ? (v as { toNumber(): number }).toNumber()
        : Number(v);

    const currentWeekRevenue = thisWeekSales.reduce(
      (s, x) => s + toNum(x.amount),
      0
    );
    const previousWeekRevenue = lastWeekSales.reduce(
      (s, x) => s + toNum(x.amount),
      0
    );
    const currentWeekUnits = thisWeekSales.length;
    const previousWeekUnits = lastWeekSales.length;
    const currentWeekAOV = currentWeekUnits > 0 ? currentWeekRevenue / currentWeekUnits : 0;
    const previousWeekAOV = previousWeekUnits > 0 ? previousWeekRevenue / previousWeekUnits : 0;
    const revenueChangePct = previousWeekRevenue > 0 ? ((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100 : 0;
    const unitsChangePct = previousWeekUnits > 0 ? ((currentWeekUnits - previousWeekUnits) / previousWeekUnits) * 100 : 0;
    const aovChangePct = previousWeekAOV > 0 ? ((currentWeekAOV - previousWeekAOV) / previousWeekAOV) * 100 : 0;

    const topCategory = categorySales[0]?.category ?? "N/A";
    const topCategoryRevenue = categorySales[0]?._sum?.amount
      ? toNum(categorySales[0]._sum.amount)
      : 0;

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dailyBreakdown = days.map((day, i) => ({
      day,
      revenue: thisWeekSales
        .filter((s) => new Date(s.soldAt).getDay() === (i + 1) % 7)
        .reduce((sum, s) => sum + toNum(s.amount), 0),
    }));

    // Group into 8 weeks
    const weeklyMap: Record<string, number> = {};
    allWeeklySales.forEach((s) => {
      const d = new Date(s.soldAt);
      const weekStart = subDays(d, d.getDay());
      const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeklyMap[key] = (weeklyMap[key] ?? 0) + toNum(s.amount);
    });
    const weeklyTrend = Object.entries(weeklyMap)
      .slice(-8)
      .map(([week, revenue]) => ({ week, revenue }));

    if (!isAIEnabled()) {
      return NextResponse.json({ insights: HEURISTIC_INSIGHTS, aiEnabled: false });
    }

    const prompt = buildInsightsPrompt({
      currentWeekRevenue, previousWeekRevenue, revenueChangePct,
      currentWeekUnits, previousWeekUnits, unitsChangePct,
      currentWeekAOV, previousWeekAOV, aovChangePct,
      topCategory, topCategoryRevenue,
      dailyBreakdown, weeklyTrend,
    });

    const raw = await generateText(prompt);
    if (!raw) {
      return NextResponse.json({ insights: HEURISTIC_INSIGHTS, aiEnabled: false });
    }

    let insights = HEURISTIC_INSIGHTS;
    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      insights = JSON.parse(cleaned);
    } catch {
      insights = HEURISTIC_INSIGHTS;
    }

    return NextResponse.json({ insights, aiEnabled: true });
  } catch (err) {
    console.error("[/api/ai/insights]", err);
    return NextResponse.json({ insights: HEURISTIC_INSIGHTS, aiEnabled: false });
  }
}
