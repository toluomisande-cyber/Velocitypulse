import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateText, isAIEnabled } from "@/lib/gemini";
import { subDays, format, addDays } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Fetch this user's sales for the last 8 weeks
    const sales = await prisma.sale.findMany({
      where: {
        userId,
        soldAt: { gte: subDays(now, 56) },
      },
      select: { amount: true, soldAt: true },
      orderBy: { soldAt: "asc" },
    });

    // Zero-State: If user has no sales, return empty zero-state forecasts
    if (sales.length === 0) {
      return NextResponse.json({
        forecasts: [],
        historicalWeekly: [],
        slope: 0,
        trendDirection: "flat",
        commentary: "No transactions recorded yet. Import your historical sales CSV to activate 4-week forward regression modeling.",
        aiEnabled: isAIEnabled(),
        isZeroState: true,
      });
    }

    const toNum = (v: unknown): number =>
      typeof v === "object" && v !== null && "toNumber" in v
        ? (v as { toNumber(): number }).toNumber()
        : Number(v);

    const weekBuckets: Record<string, number[]> = {};

    sales.forEach((s) => {
      const d = new Date(s.soldAt);
      const weekNum = Math.floor((now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
      const key = `week_${weekNum}`;
      if (!weekBuckets[key]) weekBuckets[key] = [];
      weekBuckets[key].push(toNum(s.amount));
    });

    const weeklySums = Object.entries(weekBuckets)
      .sort((a, b) => parseInt(b[0].split("_")[1]) - parseInt(a[0].split("_")[1]))
      .slice(0, 8)
      .reverse()
      .map(([, amounts]) => amounts.reduce((s, a) => s + a, 0));

    // Linear regression for trend
    const n = weeklySums.length;
    const xMean = (n - 1) / 2;
    const yMean = weeklySums.reduce((s, v) => s + v, 0) / Math.max(1, n);
    let numerator = 0, denominator = 0;
    weeklySums.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += (x - xMean) ** 2;
    });
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    const latestX = n;
    const forecasts = [1, 2, 3, 4].map((offset) => {
      const x = latestX + offset - 1;
      const base = intercept + slope * x;
      const variance = 0.08 + offset * 0.04;
      const weekStart = addDays(now, offset * 7);
      const weekEnd = addDays(weekStart, 6);
      return {
        week: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`,
        projected: Math.max(0, Math.round(base)),
        low: Math.max(0, Math.round(base * (1 - variance))),
        high: Math.round(base * (1 + variance)),
        confidence: Math.max(0.5, Number((0.92 - offset * 0.09).toFixed(2))),
      };
    });

    const trendText = slope > 0 ? "positive upward momentum" : slope < 0 ? "velocity deceleration" : "stable volume pacing";
    let commentary = `Regression model indicates ${trendText} of approximately $${Math.abs(Math.round(slope)).toLocaleString()}/wk across historical sales.`;

    if (isAIEnabled() && weeklySums.length >= 2) {
      try {
        const prompt = `Based on these weekly revenues: ${weeklySums.map((v) => `$${v.toFixed(0)}`).join(", ")} and 4-week projections: ${forecasts.map((f) => `$${f.projected}`).join(", ")}, provide a 2-sentence business forecast narrative. Be direct with real numbers, no bullet points.`;
        const aiPromise = generateText(prompt);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000));
        const result = await Promise.race([aiPromise, timeoutPromise]);
        if (result) commentary = result;
      } catch (aiErr) {
        console.warn("[/api/ai/forecast] AI error:", aiErr);
      }
    }

    return NextResponse.json({
      forecasts,
      historicalWeekly: weeklySums,
      slope: Math.round(slope),
      trendDirection: slope > 0 ? "up" : slope < 0 ? "down" : "flat",
      commentary,
      aiEnabled: isAIEnabled(),
      isZeroState: false,
    });
  } catch (err) {
    console.error("[/api/ai/forecast] Error:", err);
    return NextResponse.json({
      forecasts: [],
      historicalWeekly: [],
      slope: 0,
      trendDirection: "flat",
      commentary: "Forecast model ready. Waiting for sales transactions.",
      aiEnabled: false,
      isZeroState: true,
    });
  }
}
