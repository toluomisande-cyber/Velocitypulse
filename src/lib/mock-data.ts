import { SaleItem } from "./analytics";
import { subDays, addHours, setMinutes } from "date-fns";

export const CATEGORIES = [
  "Enterprise Plan",
  "SaaS Pro Monthly",
  "SaaS Pro Annual",
  "Consulting Retainer",
  "Custom Add-on",
  "Cloud Data Sync",
] as const;

export const CUSTOMERS = [
  "Acme Corp",
  "Stripe Labs",
  "Vercel Partner",
  "Hyperion Logistics",
  "Nexus Tech",
  "Aura Dynamics",
  "Datadog Client",
  "Zenith Financial",
  "Krypton AI",
  "Pulse Media",
  "Vortex Commerce",
  "Lumina Healthcare",
];

// Generates 90 days of fluctuating realistic transactions
export function generateRealisticSales(
  userId: string = "executive-user-001",
  days: number = 90
): SaleItem[] {
  const sales: SaleItem[] = [];
  const now = new Date();

  // Pseudo-random deterministic generator for consistent yet dynamic realism
  let seed = 42;
  function pseudoRandom() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  // Iterate day by day from 90 days ago to today
  for (let d = days; d >= 0; d--) {
    const targetDate = subDays(now, d);
    const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 6 is Saturday

    // Weekly seasonality: Tuesday to Thursday have peak velocity, weekends are slower
    let dayMultiplier = 1.0;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      dayMultiplier = 0.45; // weekend dip
    } else if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) {
      dayMultiplier = 1.4; // mid-week surge
    } else if (dayOfWeek === 5) {
      dayMultiplier = 1.1; // Friday wrap-up
    }

    // Macro trend: general upward trend over 90 days with some fluctuating dips/spikes
    const progress = (days - d) / days; // 0 to 1
    const macroGrowth = 1.0 + progress * 0.45; // 45% growth over 3 months
    const fluctuation = 0.85 + Math.sin(d / 4.5) * 0.25; // sine wave cycle

    // Transactions per day: 3 to 14 transactions
    const baseTxCount = Math.floor(4 + pseudoRandom() * 6);
    const txCount = Math.max(1, Math.round(baseTxCount * dayMultiplier * fluctuation));

    for (let i = 0; i < txCount; i++) {
      const catIndex = Math.floor(pseudoRandom() * CATEGORIES.length);
      const category = CATEGORIES[catIndex];
      const customer = CUSTOMERS[Math.floor(pseudoRandom() * CUSTOMERS.length)];

      let baseAmount = 250;
      if (category === "Enterprise Plan") {
        baseAmount = 2400 + Math.floor(pseudoRandom() * 4500);
      } else if (category === "SaaS Pro Annual") {
        baseAmount = 1200 + Math.floor(pseudoRandom() * 800);
      } else if (category === "SaaS Pro Monthly") {
        baseAmount = 149 + Math.floor(pseudoRandom() * 150);
      } else if (category === "Consulting Retainer") {
        baseAmount = 3500 + Math.floor(pseudoRandom() * 2500);
      } else if (category === "Cloud Data Sync") {
        baseAmount = 350 + Math.floor(pseudoRandom() * 450);
      } else {
        baseAmount = 99 + Math.floor(pseudoRandom() * 250);
      }

      // Add realistic hour (between 8:00 and 21:00)
      const hour = 8 + Math.floor(pseudoRandom() * 13);
      const minute = Math.floor(pseudoRandom() * 60);
      const saleDate = setMinutes(addHours(new Date(targetDate.setHours(0, 0, 0, 0)), hour), minute);

      const orderRef = `ORD-${formatOrderRef(d, i, pseudoRandom)}`;

      sales.push({
        id: `sale_${d}_${i}_${Math.floor(pseudoRandom() * 100000)}`,
        userId,
        amount: Math.round(baseAmount * 100) / 100,
        currency: "USD",
        category,
        customerName: customer,
        orderRef,
        notes: i % 4 === 0 ? "Processed via automated recurring checkout" : undefined,
        soldAt: saleDate,
        createdAt: saleDate,
      });
    }
  }

  // Sort descending by soldAt
  return sales.sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
}

function formatOrderRef(day: number, index: number, randFn: () => number) {
  const code = Math.floor(1000 + randFn() * 9000);
  return `2026-${(100 + day).toString().slice(1)}-${code}`;
}

// Global in-memory storage for high-speed local interactivity
let cachedSales: SaleItem[] | null = null;

export function getInitialSales(userId: string = "executive-user-001"): SaleItem[] {
  if (!cachedSales) {
    cachedSales = generateRealisticSales(userId, 90);
  }
  return cachedSales;
}

export function addSaleToStore(sale: Omit<SaleItem, "id">): SaleItem {
  const current = getInitialSales(sale.userId);
  const newSale: SaleItem = {
    ...sale,
    id: `sale_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date(),
  };
  cachedSales = [newSale, ...current];
  return newSale;
}

export function bulkAddSalesToStore(salesToAdd: Omit<SaleItem, "id">[]): SaleItem[] {
  const current = getInitialSales();
  const created: SaleItem[] = salesToAdd.map((s, idx) => ({
    ...s,
    id: `sale_bulk_${Date.now()}_${idx}`,
    createdAt: new Date(),
  }));
  cachedSales = [...created, ...current].sort(
    (a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime()
  );
  return created;
}

