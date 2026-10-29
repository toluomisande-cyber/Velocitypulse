import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateText, isAIEnabled } from "@/lib/gemini";
import { subDays, startOfDay, format, addDays } from "date-fns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();

    // Get last 8 weeks of data to identify trend
    const sales = await prisma.sale.findMany({
      where: { soldAt: { gte: subDays(now, 56) } },
      select: { amount: true, soldAt: true },
      orderBy: { soldAt: "asc" },
    });

    // Build weekly buckets
    const weekBuckets: Record<string, number[]> = {};
    const toNum = (v: unknown): number =>
      typeof v === "object" && v !== null && "toNumber" in v
        ? (v as { toNumber(): number }).toNumber()
        : Number(v);

    sales.forEach((s) => {
      const d = new Date(s.soldAt);
      const weekNum = Math.floor(
        (now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const key = `week_${weekNum}`;
      if (!weekBuckets[key]) weekBuckets[key] = [];
      weekBuckets[key].push(toNum(s.amount));
    });

    const weeklySums = Object.entries(weekBuckets)
      .sort((a, b) => parseInt(b[0].split("_")[1]) - parseInt(a[0].split("_")[1]))
      .slice(0, 8)
      .reverse()
      .map(([key, amounts]) => amounts.reduce((s, a) => s + a, 0));

    // Simple linear regression for trend
    const n = weeklySums.length;
    const xMean = (n - 1) / 2;
    const yMean = weeklySums.reduce((s, v) => s + v, 0) / n;
    let numerator = 0, denominator = 0;
    weeklySums.forEach((y, x) => {
      numerator += (x - xMean) * (y - yMean);
      denominator += (x - xMean) ** 2;
    });
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // Project next 4 weeks with confidence degradation
    const latestX = n;
    const forecasts = [1, 2, 3, 4].map((offset) => {
      const x = latestX + offset - 1;
      const base = intercept + slope * x;
      const variance = 0.08 + offset * 0.04; // grows with distance
      const weekStart = addDays(now, offset * 7);
      const weekEnd = addDays(weekStart, 6);
      return {
        week: `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d")}`,
        projected: Math.max(0, Math.round(base)),
        low: Math.max(0, Math.round(base * (1 - variance))),
        high: Math.round(base * (1 + variance)),
        confidence: Math.max(0.5, 0.92 - offset * 0.09),
      };
    });

    // AI commentary on the forecast (if available)
    let commentary = null;
    if (isAIEnabled()) {
      const prompt = `You are a business analyst. Based on these weekly revenue figures (in USD), provide a 2-sentence forecast narrative. 
Historical (oldest to newest): ${weeklySums.map((v) => `$${v.toFixed(0)}`).join(", ")}
Projected next 4 weeks: ${forecasts.map((f) => `$${f.projected}`).join(", ")}
Be specific about the trend direction and any risk. 2 sentences max, no bullet points.`;
      commentary = await generateText(prompt);
    }

    return NextResponse.json({
      forecasts,
      historicalWeekly: weeklySums,
      slope: Math.round(slope),
      trendDirection: slope > 0 ? "up" : slope < 0 ? "down" : "flat",
      commentary,
      aiEnabled: isAIEnabled(),
    });
  } catch (err) {
    console.error("[/api/ai/forecast]", err);
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 });
  }
}
