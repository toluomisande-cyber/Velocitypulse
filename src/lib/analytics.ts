import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  getDate,
  getDaysInMonth,
} from "date-fns";

export interface SaleItem {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  category: string;
  customerName?: string | null;
  orderRef?: string | null;
  notes?: string | null;
  soldAt: Date | string;
  createdAt?: Date | string;
}

export interface KPISummary {
  currentWeekRevenue: number;
  previousWeekRevenue: number;
  revenueChangePct: number;
  currentWeekUnits: number;
  previousWeekUnits: number;
  unitsChangePct: number;
  currentWeekAOV: number;
  previousWeekAOV: number;
  aovChangePct: number;
  projectedMonthRunRate: number;
  monthRevenueSoFar: number;
  velocityScore: number;
}

export interface DailyVelocityPoint {
  dayName: string;
  dayShort: string;
  currentWeek: number;
  previousWeek: number;
  currentWeekCumulative: number;
  previousWeekCumulative: number;
}

export interface WeeklyBarPoint {
  weekKey: string;
  weekLabel: string;
  startDate: string;
  endDate: string;
  revenue: number;
  units: number;
  aov: number;
  velocityPct: number;
}

export interface VelocityGaugeData {
  velocityPct: number;
  status: "Hyper-Growth" | "High Velocity" | "Moderate Growth" | "Flat" | "Decelerating" | "Sharp Decline";
  colorClass: string;
  summaryText: string;
  currentWeekRevenue: number;
  previousWeekRevenue: number;
  deltaRevenue: number;
}

export function calculateDashboardMetrics(
  sales: SaleItem[],
  referenceDate: Date = new Date()
) {
  // Normalize date
  const now = new Date(referenceDate);

  // Current week (Monday - Sunday)
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Previous week
  const previousWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  // Month calculations
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const currentDayOfMonth = getDate(now);
  const totalDaysInMonth = getDaysInMonth(now);

  // Filter sales
  let currentWeekRevenue = 0;
  let currentWeekUnits = 0;
  let previousWeekRevenue = 0;
  let previousWeekUnits = 0;
  let monthRevenueSoFar = 0;

  sales.forEach((s) => {
    const saleDate = new Date(s.soldAt);
    const amount = Number(s.amount) || 0;

    // Current Week
    if (saleDate >= currentWeekStart && saleDate <= currentWeekEnd) {
      currentWeekRevenue += amount;
      currentWeekUnits += 1;
    }

    // Previous Week
    if (saleDate >= previousWeekStart && saleDate <= previousWeekEnd) {
      previousWeekRevenue += amount;
      previousWeekUnits += 1;
    }

    // Month so far
    if (saleDate >= monthStart && saleDate <= now) {
      monthRevenueSoFar += amount;
    }
  });

  // Calculate percentage changes
  const calcChange = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const revenueChangePct = calcChange(currentWeekRevenue, previousWeekRevenue);
  const unitsChangePct = calcChange(currentWeekUnits, previousWeekUnits);

  const currentWeekAOV = currentWeekUnits > 0 ? currentWeekRevenue / currentWeekUnits : 0;
  const previousWeekAOV = previousWeekUnits > 0 ? previousWeekRevenue / previousWeekUnits : 0;
  const aovChangePct = calcChange(currentWeekAOV, previousWeekAOV);

  // Projected Run Rate = (monthRevenueSoFar / daysElapsed) * totalDaysInMonth
  const safeDaysElapsed = Math.max(1, currentDayOfMonth);
  const projectedMonthRunRate = (monthRevenueSoFar / safeDaysElapsed) * totalDaysInMonth;

  // Daily velocity comparison (Monday through Sunday)
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  let currCumul = 0;
  let prevCumul = 0;

  const dailyVelocity: DailyVelocityPoint[] = daysOfWeek.map((dayShort, index) => {
    // Current week day
    const currDayDate = new Date(currentWeekStart);
    currDayDate.setDate(currDayDate.getDate() + index);

    // Previous week day
    const prevDayDate = new Date(previousWeekStart);
    prevDayDate.setDate(prevDayDate.getDate() + index);

    const currDaySales = sales
      .filter((s) => isSameDay(new Date(s.soldAt), currDayDate))
      .reduce((sum, s) => sum + Number(s.amount), 0);

    const prevDaySales = sales
      .filter((s) => isSameDay(new Date(s.soldAt), prevDayDate))
      .reduce((sum, s) => sum + Number(s.amount), 0);

    currCumul += currDaySales;
    prevCumul += prevDaySales;

    return {
      dayName: format(currDayDate, "EEEE"),
      dayShort,
      currentWeek: Math.round(currDaySales * 100) / 100,
      previousWeek: Math.round(prevDaySales * 100) / 100,
      currentWeekCumulative: Math.round(currCumul * 100) / 100,
      previousWeekCumulative: Math.round(prevCumul * 100) / 100,
    };
  });

  // Week-over-Week Breakdown for last 10 weeks
  const weeklyBreakdown: WeeklyBarPoint[] = [];
  for (let i = 9; i >= 0; i--) {
    const wStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const wEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });

    let rev = 0;
    let units = 0;

    sales.forEach((s) => {
      const d = new Date(s.soldAt);
      if (d >= wStart && d <= wEnd) {
        rev += Number(s.amount);
        units += 1;
      }
    });

    const aov = units > 0 ? rev / units : 0;
    weeklyBreakdown.push({
      weekKey: format(wStart, "yyyy-'W'II"),
      weekLabel: `W${format(wStart, "w")} (${format(wStart, "MMM d")})`,
      startDate: format(wStart, "yyyy-MM-dd"),
      endDate: format(wEnd, "yyyy-MM-dd"),
      revenue: Math.round(rev),
      units,
      aov: Math.round(aov * 100) / 100,
      velocityPct: 0, // calculated next
    });
  }

  // Calculate velocity for each week in the breakdown
  for (let i = 1; i < weeklyBreakdown.length; i++) {
    const prevRev = weeklyBreakdown[i - 1].revenue;
    const currRev = weeklyBreakdown[i].revenue;
    weeklyBreakdown[i].velocityPct = Math.round(calcChange(currRev, prevRev) * 10) / 10;
  }

  // Velocity Gauge info
  const deltaRevenue = currentWeekRevenue - previousWeekRevenue;
  let status: VelocityGaugeData["status"] = "Flat";
  let colorClass = "text-zinc-400";
  let summaryText = "Sales pace is aligned with the prior week baseline.";

  if (revenueChangePct >= 25) {
    status = "Hyper-Growth";
    colorClass = "text-emerald-400";
    summaryText = "Extraordinary revenue acceleration exceeding +25% WoW velocity.";
  } else if (revenueChangePct >= 10) {
    status = "High Velocity";
    colorClass = "text-emerald-500";
    summaryText = "Solid positive traction outperforming previous week targets.";
  } else if (revenueChangePct > 0) {
    status = "Moderate Growth";
    colorClass = "text-teal-400";
    summaryText = "Modest upward momentum week-over-week.";
  } else if (revenueChangePct > -10) {
    status = "Decelerating";
    colorClass = "text-amber-400";
    summaryText = "Minor contraction compared to last week; pacing slightly slower.";
  } else {
    status = "Sharp Decline";
    colorClass = "text-rose-500";
    summaryText = "Sales drop steeper than 10% WoW; immediate intervention suggested.";
  }

  const velocityGauge: VelocityGaugeData = {
    velocityPct: Math.round(revenueChangePct * 10) / 10,
    status,
    colorClass,
    summaryText,
    currentWeekRevenue: Math.round(currentWeekRevenue),
    previousWeekRevenue: Math.round(previousWeekRevenue),
    deltaRevenue: Math.round(deltaRevenue),
  };

  const kpis: KPISummary = {
    currentWeekRevenue,
    previousWeekRevenue,
    revenueChangePct,
    currentWeekUnits,
    previousWeekUnits,
    unitsChangePct,
    currentWeekAOV,
    previousWeekAOV,
    aovChangePct,
    projectedMonthRunRate,
    monthRevenueSoFar,
    velocityScore: revenueChangePct,
  };

  return {
    kpis,
    dailyVelocity,
    weeklyBreakdown,
    velocityGauge,
  };
}

