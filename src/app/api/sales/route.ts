import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const category = searchParams.get("category") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "soldAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    // Construct Prisma WHERE clause strictly scoped to userId
    const whereClause: any = { userId };

    if (category !== "all") {
      whereClause.category = category;
    }

    if (startDate || endDate) {
      whereClause.soldAt = {};
      if (startDate) whereClause.soldAt.gte = new Date(startDate);
      if (endDate) whereClause.soldAt.lte = new Date(endDate);
    }

    if (search) {
      whereClause.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { orderRef: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const [totalCount, sales] = await Promise.all([
      prisma.sale.count({ where: whereClause }),
      prisma.sale.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: sales,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[/api/sales] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, category, customerName, orderRef, notes, soldAt } = body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "A valid positive sale amount is required" },
        { status: 400 }
      );
    }

    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 }
      );
    }

    const saleDate = soldAt ? new Date(soldAt) : new Date();

    const createdSale = await prisma.sale.create({
      data: {
        userId,
        amount: parseFloat(numAmount.toFixed(2)),
        currency: "USD",
        category: category.trim(),
        customerName: customerName ? customerName.trim() : null,
        orderRef: orderRef ? orderRef.trim() : `ORD-${Date.now().toString().slice(-6)}`,
        notes: notes ? notes.trim() : null,
        soldAt: saleDate,
      },
    });

    return NextResponse.json({
      success: true,
      data: createdSale,
    });
  } catch (error) {
    console.error("[/api/sales] POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record sale in database" },
      { status: 500 }
    );
  }
}
