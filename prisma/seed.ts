import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateRealisticSales } from "../src/lib/mock-data";
import { startOfWeek, endOfWeek, subWeeks, format, getISOWeek, getYear } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed for Sales Velocity Dashboard...");

  const demoEmail = "demo@acme.com";
  const defaultPassword = "password123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Upsert Demo User
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {
      passwordHash,
      businessName: "Acme Analytics Corp",
    },
    create: {
      email: demoEmail,
      passwordHash,
      businessName: "Acme Analytics Corp",
    },
  });

  console.log(`✅ User ready: ${user.email} (${user.id})`);

  // 2. Clear previous sales for clean seed
  const deletedSales = await prisma.sale.deleteMany({
    where: { userId: user.id },
  });
  console.log(`🧹 Cleaned ${deletedSales.count} existing sales records.`);

  // 3. Generate 90 days of realistic fluctuating sales data
  const rawSales = generateRealisticSales(user.id, 90);

  console.log(`📦 Inserting ${rawSales.length} realistic sales across 90 days...`);

  // Batch insert into Prisma
  // We can insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < rawSales.length; i += batchSize) {
    const chunk = rawSales.slice(i, i + batchSize).map((s) => ({
      userId: user.id,
      amount: s.amount,
      currency: s.currency,
      category: s.category,
      customerName: s.customerName,
      orderRef: s.orderRef,
      notes: s.notes,
      soldAt: new Date(s.soldAt),
    }));

    await prisma.sale.createMany({
      data: chunk,
    });
  }

  console.log(`✅ Successfully seeded ${rawSales.length} sales.`);

  // 4. Compute WeeklyMetrics table cache for historical weeks
  console.log("📊 Computing weekly metrics cache...");
  await prisma.weeklyMetric.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  const metricsToInsert = [];

  for (let w = 12; w >= 0; w--) {
    const targetDate = subWeeks(now, w);
    const wStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const wEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
    const weekNumber = getISOWeek(wStart);
    const year = getYear(wStart);

    // Prior week for velocity computation
    const prevStart = startOfWeek(subWeeks(wStart, 1), { weekStartsOn: 1 });
    const prevEnd = endOfWeek(subWeeks(wStart, 1), { weekStartsOn: 1 });

    const weekSales = rawSales.filter((s) => {
      const d = new Date(s.soldAt);
      return d >= wStart && d <= wEnd;
    });

    const prevWeekSales = rawSales.filter((s) => {
      const d = new Date(s.soldAt);
      return d >= prevStart && d <= prevEnd;
    });

    const totalRevenue = weekSales.reduce((acc, s) => acc + s.amount, 0);
    const totalUnits = weekSales.length;
    const aov = totalUnits > 0 ? totalRevenue / totalUnits : 0;

    const prevRev = prevWeekSales.reduce((acc, s) => acc + s.amount, 0);
    const velocityPct = prevRev > 0 ? ((totalRevenue - prevRev) / prevRev) * 100 : 0;

    metricsToInsert.push({
      userId: user.id,
      weekStartDate: wStart,
      weekEndDate: wEnd,
      weekNumber,
      year,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalUnits,
      aov: Math.round(aov * 100) / 100,
      velocityPct: Math.round(velocityPct * 10) / 10,
    });
  }

  for (const metric of metricsToInsert) {
    await prisma.weeklyMetric.create({
      data: metric,
    });
  }

  console.log(`✅ Created ${metricsToInsert.length} weekly metric summaries.`);
  console.log("🎉 Seed finished successfully!");
  console.log("👉 Login credentials: demo@acme.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

