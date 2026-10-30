import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, businessName } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanBusinessName = (businessName && typeof businessName === "string" && businessName.trim().length > 0)
      ? businessName.trim()
      : "Executive Commerce";

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
    }

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new tenant
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        businessName: cleanBusinessName,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        businessName: newUser.businessName,
      },
    });
  } catch (err) {
    console.error("[/api/auth/register] Registration error:", err);
    return NextResponse.json({ error: "Failed to create account. Please try again." }, { status: 500 });
  }
}

