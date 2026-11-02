import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const imports = await prisma.csvImport.findMany({
      where: { userId },
      orderBy: { importedAt: "desc" },
      select: {
        id: true,
        filename: true,
        rowCount: true,
        importedAt: true,
        _count: { select: { sales: true } },
      },
    });

    return NextResponse.json({ success: true, imports });
  } catch (err) {
    console.error("[/api/imports] GET error:", err);
    return NextResponse.json({ success: false, error: "Failed to fetch imports." }, { status: 500 });
  }
}
