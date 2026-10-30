import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDashboardMetrics } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch ONLY the authenticated user's sales from the database
    const sales = await prisma.sale.findMany({
      where: { userId },
      orderBy: { soldAt: "desc" },
    });

    const metrics = calculateDashboardMetrics(sales);

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        totalTransactions: sales.length,
      },
    });
  } catch (error) {
    console.error("[/api/metrics] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}
