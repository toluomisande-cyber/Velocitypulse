import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No records found in CSV file to import." },
        { status: 400 }
      );
    }

    const validatedSales: Array<{
      userId: string;
      amount: number;
      currency: string;
      category: string;
      customerName: string | null;
      orderRef: string | null;
      notes: string | null;
      soldAt: Date;
    }> = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const rawAmount = row.amount || row.Amount || row.price || row.Price || row.revenue || row.Revenue;
      const amount = parseFloat(rawAmount);

      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row #${rowNum}: Missing or invalid positive numeric amount.`);
        return;
      }

      const category = (row.category || row.Category || row.type || "General Sales").toString().trim();
      const rawCustomer = row.customerName || row.CustomerName || row.customer || row.Customer || row.client || row.Client;
      const customerName = rawCustomer ? rawCustomer.toString().trim() : null;

      const rawOrder = row.orderRef || row.OrderRef || row.order_id || row.orderId || row.Invoice || row.id;
      const orderRef = rawOrder ? rawOrder.toString().trim() : `ORD-${Date.now().toString().slice(-4)}-${rowNum}`;

      const rawNotes = row.notes || row.Notes || row.description;
      const notes = rawNotes ? rawNotes.toString().trim() : null;

      const rawDate = row.soldAt || row.Date || row.date || row.timestamp || row.created_at;
      let soldAt = new Date();
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          soldAt = parsed;
        }
      }

      validatedSales.push({
        userId,
        amount: parseFloat(amount.toFixed(2)),
        currency: "USD",
        category: category || "Enterprise Plan",
        customerName,
        orderRef,
        notes,
        soldAt,
      });
    });

    if (validatedSales.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "None of the rows passed validation.",
          details: errors,
        },
        { status: 400 }
      );
    }

    // Insert batch directly into PostgreSQL scoped to this tenant
    const res = await prisma.sale.createMany({
      data: validatedSales,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${res.count} sales records into your database.`,
      importedCount: res.count,
      errorsCount: errors.length,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    console.error("[/api/sales/bulk] Bulk import error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process bulk import in database." },
      { status: 500 }
    );
  }
}
