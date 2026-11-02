import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Verify ownership before deleting
    const csvImport = await prisma.csvImport.findUnique({ where: { id } });
    if (!csvImport || csvImport.userId !== userId) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // Sales are cascade-deleted (or set to null) by the DB; we delete the import batch
    // First null out importId on matching sales (orphan protection), then delete import
    await prisma.$transaction([
      prisma.sale.deleteMany({ where: { importId: id, userId } }),
      prisma.csvImport.delete({ where: { id } }),
    ]);

    return NextResponse.json({ success: true, deletedImportId: id });
  } catch (err) {
    console.error("[/api/imports/[id]] DELETE error:", err);
    return NextResponse.json({ success: false, error: "Failed to delete import." }, { status: 500 });
  }
}
