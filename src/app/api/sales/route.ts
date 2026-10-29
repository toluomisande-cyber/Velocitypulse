import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInitialSales, addSaleToStore } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id || "admin-user-001";

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const category = searchParams.get("category") || "all";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "soldAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    let allSales = [];

    try {
      allSales = await prisma.sale.findMany({
        where: userId !== "admin-user-001" ? { userId } : {},
        orderBy: { [sortBy]: sortOrder },
      });

      if (!allSales || allSales.length === 0) {
        allSales = await prisma.sale.findMany({
          orderBy: { [sortBy]: sortOrder },
        });
      }
    } catch {
      allSales = getInitialSales(userId);
    }

    if (!allSales || allSales.length === 0) {
      allSales = getInitialSales(userId);
    }

    // Filter in-memory for fast and dynamic search
    let filtered = allSales.filter((item) => {
      // Category filter
      if (category !== "all" && item.category !== category) {
        return false;
      }

      // Search term
      if (search) {
        const matchesCustomer = item.customerName?.toLowerCase().includes(search);
        const matchesRef = item.orderRef?.toLowerCase().includes(search);
        const matchesCat = item.category?.toLowerCase().includes(search);
        const matchesNotes = item.notes?.toLowerCase().includes(search);
        if (!matchesCustomer && !matchesRef && !matchesCat && !matchesNotes) {
          return false;
        }
      }

      // Date range filter
      if (startDate) {
        const d = new Date(item.soldAt).getTime();
        const start = new Date(startDate).getTime();
        if (d < start) return false;
      }

      if (endDate) {
        const d = new Date(item.soldAt).getTime();
        const end = new Date(endDate).getTime();
        if (d > end) return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof typeof a];
      let valB: any = b[sortBy as keyof typeof b];

      if (sortBy === "soldAt" || sortBy === "createdAt") {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedItems,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Sales API GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id || "admin-user-001";

    const body = await req.json();
    const { amount, category, customerName, orderRef, notes, soldAt } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "Valid amount is required" },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category is required" },
        { status: 400 }
      );
    }

    const saleDate = soldAt ? new Date(soldAt) : new Date();

    let createdSale;

    try {
      createdSale = await prisma.sale.create({
        data: {
          userId,
          amount: parseFloat(Number(amount).toFixed(2)),
          currency: "USD",
          category,
          customerName: customerName || "Anonymous Customer",
          orderRef: orderRef || `ORD-${Date.now().toString().slice(-6)}`,
          notes: notes || null,
          soldAt: saleDate,
        },
      });
    } catch {
      // Fallback to store
      createdSale = addSaleToStore({
        userId,
        amount: parseFloat(Number(amount).toFixed(2)),
        currency: "USD",
        category,
        customerName: customerName || "Anonymous Customer",
        orderRef: orderRef || `ORD-${Date.now().toString().slice(-6)}`,
        notes: notes || null,
        soldAt: saleDate,
      });
    }

    return NextResponse.json({
      success: true,
      data: createdSale,
    });
  } catch (error) {
    console.error("Sales API POST Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create sale" },
      { status: 500 }
    );
  }
}

