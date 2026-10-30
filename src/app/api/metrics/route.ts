import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateDashboardMetrics } from "@/lib/analytics";
import { getInitialSales } from "@/lib/mock-data";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id || "admin-user-001";

    let sales = [];

    // Try Prisma database first
    try {
      sales = await prisma.sale.findMany({
        where: userId !== "admin-user-001" ? { userId } : {},
        orderBy: { soldAt: "desc" },
      });

      if (!sales || sales.length === 0) {
        sales = await prisma.sale.findMany({
          orderBy: { soldAt: "desc" },
        });
      }
    } catch (dbErr) {
      console.warn("[Metrics API] Database fetch error, using local ledger:", dbErr);
      sales = getInitialSales(userId);
    }

    if (!sales || sales.length === 0) {
      sales = getInitialSales(userId);
    }

    const metrics = calculateDashboardMetrics(sales);

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        totalTransactions: sales.length,
      },
    });
  } catch (error) {
    console.error("Metrics API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate metrics" },
      { status: 500 }
    );
  }
}
