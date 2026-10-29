import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDashboardMetrics } from "@/lib/analytics";
import { getInitialSales } from "@/lib/mock-data";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id || "demo-user-123";

    let sales = [];

    // Try Prisma database first
    try {
      sales = await prisma.sale.findMany({
        where: { userId },
        orderBy: { soldAt: "desc" },
      });
    } catch {
      // Database not reachable, use in-memory seed store
      sales = getInitialSales(userId);
    }

    if (!sales || sales.length === 0) {
      sales = getInitialSales(userId);
    }

    const metrics = calculateDashboardMetrics(sales);

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Metrics API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}

