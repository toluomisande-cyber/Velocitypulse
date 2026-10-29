import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bulkAddSalesToStore } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id || "demo-user-123";

    const body = await req.json();
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "No records found to import." },
        { status: 400 }
      );
    }

    const validatedSales: any[] = [];
    const errors: string[] = [];

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      const amount = parseFloat(row.amount || row.Amount || row.price || row.Price || 0);

      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row #${rowNum}: Missing or invalid positive amount.`);
        return;
      }

      const category = (row.category || row.Category || "Enterprise Plan").trim();
      const customerName = (row.customerName || row.Customer || row.customer || "Direct Client").trim();
      const orderRef = (row.orderRef || row.OrderRef || row.order_id || `CSV-${Date.now().toString().slice(-4)}-${rowNum}`).trim();
      const notes = (row.notes || row.Notes || "Imported via CSV bulk upload").trim();

      const rawDate = row.soldAt || row.Date || row.date || row.timestamp;
      let soldAt = new Date();
      if (rawDate) {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          soldAt = parsed;
        }
      }

      validatedSales.push({
        userId,
        amount,
        currency: "USD",
        category,
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

    let insertedCount = 0;

    try {
      const res = await prisma.sale.createMany({
        data: validatedSales,
      });
      insertedCount = res.count;
    } catch {
      // In-memory fallback
      const fallbackInserted = bulkAddSalesToStore(validatedSales);
      insertedCount = fallbackInserted.length;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${insertedCount} transactions.`,
      importedCount: insertedCount,
      errorsCount: errors.length,
      errors: errors.slice(0, 5), // return first 5 validation warnings if any
    });
  } catch (error) {
    console.error("Bulk Import API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process bulk import." },
      { status: 500 }
    );
  }
}

