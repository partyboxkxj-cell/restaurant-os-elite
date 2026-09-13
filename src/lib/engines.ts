import type { AppRole } from "./rbac";
import type { AuditRow, CalendarEvent, InventoryRow, Location, PnlRow, Sale } from "./types";

/* ============================================================
 * 1. MICRO-VARIANCE INVENTORY ALGORITHM (theft detection)
 * Cross-references raw ingredient depletion against POS ticket
 * modifiers. A "1 Burger + 4 Extra Patties" ticket depletes
 * 5 patties but only 1 bun — so a bun shortfall that patties do
 * not explain means product left the building unrecorded.
 * ============================================================ */

/** Bill of materials per unit sold (per SKU). */
export const RECIPE: Record<string, Record<string, number>> = {
  BURGER: { "Beef Patty": 1, "Burger Bun": 1, "Cheese Slice": 1, Lettuce: 0.02 },
  FRIES: { "Potato Fries": 0.18, "Cooking Oil": 0.02 },
};

/** Modifier name -> ingredient it adds (does NOT add a bun). */
export const MODIFIER_MAP: Record<string, { item: string; qty: number }> = {
  "extra patty": { item: "Beef Patty", qty: 1 },
  "extra cheese": { item: "Cheese Slice", qty: 1 },
};

export type Depletion = Record<string, number>;

export function theoreticalDepletion(sales: Sale[]): Depletion {
  const out: Depletion = {};
  const add = (item: string, qty: number) => {
    out[item] = Number(((out[item] ?? 0) + qty).toFixed(3));
  };
  for (const sale of sales) {
    if (sale.voided) continue;
    for (const item of sale.ticket_data?.items ?? []) {
      const recipe = RECIPE[item.sku];
      if (recipe) {
        for (const [ing, per] of Object.entries(recipe)) add(ing, per * (item.qty || 0));
      }
      for (const mod of item.modifiers ?? []) {
        const mapped = MODIFIER_MAP[mod.name.toLowerCase()];
        if (mapped) add(mapped.item, mapped.qty * (mod.qty || 0) * (item.qty || 1));
      }
    }
  }
  return out;
}

export type VarianceFinding = {
  id: string;
  locationId: string;
  item: string;
  theoretical: number;
  actual: number;
  variance: number;
  valueAtRisk: number;
  severity: "Critical" | "High" | "Watch";
  headline: string;
  narrative: string;
  action: string;
};

export function detectVariance(
  ledger: InventoryRow[],
  sales: Sale[],
  locations: Location[],
): VarianceFinding[] {
  const byLocation = new Map<string, InventoryRow[]>();
  for (const row of ledger) {
    byLocation.set(row.location_id, [...(byLocation.get(row.location_id) ?? []), row]);
  }
  const findings: VarianceFinding[] = [];

  for (const [locationId, rows] of byLocation) {
    const locSales = sales.filter((s) => s.location_id === locationId);
    const depletion = theoreticalDepletion(locSales);
    const loc = locations.find((l) => l.id === locationId);
    const patty = rows.find((r) => r.item_name === "Beef Patty");
    const bun = rows.find((r) => r.item_name === "Burger Bun");

    for (const row of rows) {
      const variance = Number((row.actual_qty - row.theoretical_qty).toFixed(2));
      if (variance >= 0 && !row.variance_alert) continue;
      if (Math.abs(variance) < 1) continue;

      const valueAtRisk = Math.abs(variance) * row.unit_cost;
      let severity: VarianceFinding["severity"] = Math.abs(variance) >= 3 ? "High" : "Watch";
      let narrative = `Physical count is ${Math.abs(variance)} ${row.unit} ${
        variance < 0 ? "short of" : "above"
      } theoretical usage derived from POS depletion (${(depletion[row.item_name] ?? 0).toFixed(1)} ${row.unit} consumed by tickets).`;
      let headline = `${row.item_name} variance — ${loc?.name ?? "Unknown"}`;
      let action = "Recount stock, validate recipe execution, post an approved adjustment with evidence.";

      // Signature theft pattern: bun shortfall not explained by patty depletion.
      if (row.item_name === "Burger Bun" && patty && bun && variance <= -2) {
        const pattyVariance = patty.actual_qty - patty.theoretical_qty;
        if (pattyVariance >= -1) {
          severity = "Critical";
          headline = `CRITICAL THEFT ANOMALY — ${loc?.name ?? "Unknown"}`;
          narrative =
            `Buns short by ${Math.abs(variance)} while patty depletion reconciles within tolerance ` +
            `(patty variance ${pattyVariance.toFixed(1)}). Modifier-heavy tickets ("1 Burger + 4 Extra Patties") ` +
            `deplete 5 patties but only 1 bun, so patties cannot mask this. ${Math.abs(variance)} assembled burgers ` +
            `left the line with no matching ticket — free hand-outs or theft.`;
          action =
            "Freeze the terminal, pull CCTV for the shift window, interview cashier and line, raise HR case.";
        }
      }

      findings.push({
        id: row.id,
        locationId,
        item: row.item_name,
        theoretical: row.theoretical_qty,
        actual: row.actual_qty,
        variance,
        valueAtRisk: Number(valueAtRisk.toFixed(2)),
        severity,
        headline,
        narrative,
        action,
      });
    }
  }

  const rank = { Critical: 0, High: 1, Watch: 2 } as const;
  return findings.sort(
    (a, b) => rank[a.severity] - rank[b.severity] || b.valueAtRisk - a.valueAtRisk,
  );
}

/* ============================================================
 * 2. TIME-BOUND SLA ESCALATION MATRIX
 * 0h   -> Restaurant Manager
 * 48h  -> Area Manager + HR Officer
 * 96h  -> Operations Manager + HR Manager
 * Theft / Cash Manipulation -> instant bypass to MD, COO, Head HR
 * ============================================================ */

export type Escalation = {
  level: number;
  owner: AppRole;
  notify: AppRole[];
  label: string;
  bypass: boolean;
  hoursOpen: number;
  hoursToNext: number | null;
  breached: boolean;
};

const THEFT_KEYWORDS = ["theft", "cash manipulation", "till shortage", "unauthorised discount"];

export function isCriticalBypass(audit: Pick<AuditRow, "category" | "violation_type">) {
  const haystack = `${audit.category} ${audit.violation_type}`.toLowerCase();
  return THEFT_KEYWORDS.some((k) => haystack.includes(k));
}

export function escalate(audit: AuditRow, now = new Date()): Escalation {
  const hoursOpen = Math.max(
    0,
    (now.getTime() - new Date(audit.timestamp).getTime()) / 3_600_000,
  );
  const closed = audit.status === "Resolved" || audit.status === "Closed";

  if (isCriticalBypass(audit)) {
    return {
      level: 3,
      owner: "MD",
      notify: ["MD", "COO", "Head HR"],
      label: "Critical bypass — Upper Management + Head HR alerted instantly",
      bypass: true,
      hoursOpen,
      hoursToNext: null,
      breached: !closed,
    };
  }
  if (closed) {
    return {
      level: 0,
      owner: "Restaurant Manager",
      notify: [],
      label: "Closed with evidence",
      bypass: false,
      hoursOpen,
      hoursToNext: null,
      breached: false,
    };
  }
  if (hoursOpen >= 96) {
    return {
      level: 2,
      owner: "Operations Manager",
      notify: ["Operations Manager", "HR Manager"],
      label: "96h breach — Operations Manager & HR Manager",
      bypass: false,
      hoursOpen,
      hoursToNext: null,
      breached: true,
    };
  }
  if (hoursOpen >= 48) {
    return {
      level: 1,
      owner: "Area Manager",
      notify: ["Area Manager", "HR Officer"],
      label: "48h breach — Area Manager & HR Officer",
      bypass: false,
      hoursOpen,
      hoursToNext: 96 - hoursOpen,
      breached: true,
    };
  }
  return {
    level: 0,
    owner: "Restaurant Manager",
    notify: ["Restaurant Manager"],
    label: "Active on Restaurant Manager dashboard",
    bypass: false,
    hoursOpen,
    hoursToNext: 48 - hoursOpen,
    breached: false,
  };
}

/* ============================================================
 * 3. PREDICTIVE FORECASTING & PREP PLANNING
 * Hourly demand curve from comparable history (same weekday +
 * recency weighting) with occasion multipliers applied.
 * ============================================================ */

export type HourlyPrep = {
  hour: number;
  label: string;
  covers: number;
  revenue: number;
  patties: number;
  buns: number;
  friesKg: number;
  staff: number;
};

export function eventMultiplier(date: Date, country: string, events: CalendarEvent[]) {
  const key = date.toISOString().slice(0, 10);
  let factor = 1;
  const matched: CalendarEvent[] = [];
  for (const event of events) {
    if (event.country !== country && event.country !== "Global") continue;
    if (key >= event.start_date && key <= event.end_date) {
      factor *= Number(event.multiplier);
      matched.push(event);
    }
  }
  return { factor: Number(factor.toFixed(3)), matched };
}

export function buildForecast(
  sales: Sale[],
  targetDate: Date,
  country: string,
  events: CalendarEvent[],
): { hours: HourlyPrep[]; factor: number; matched: CalendarEvent[]; confidence: number } {
  const { factor, matched } = eventMultiplier(targetDate, country, events);
  const targetDow = targetDate.getDay();

  const buckets = new Map<number, { revenue: number; tickets: number; weight: number }>();
  for (const sale of sales) {
    if (sale.voided) continue;
    const ts = new Date(sale.timestamp);
    const hour = ts.getHours();
    const sameDow = ts.getDay() === targetDow;
    const ageDays = Math.max(
      1,
      (targetDate.getTime() - ts.getTime()) / 86_400_000,
    );
    const weight = (sameDow ? 3 : 1) * (1 / Math.sqrt(ageDays));
    const bucket = buckets.get(hour) ?? { revenue: 0, tickets: 0, weight: 0 };
    bucket.revenue += Number(sale.total_amount) * weight;
    bucket.tickets += weight;
    bucket.weight += weight;
    buckets.set(hour, bucket);
  }

  const hours: HourlyPrep[] = [];
  for (let hour = 8; hour <= 23; hour++) {
    const bucket = buckets.get(hour);
    const avgRevenue = bucket && bucket.weight ? bucket.revenue / bucket.weight : 0;
    const avgTickets = bucket && bucket.weight ? bucket.tickets / bucket.weight : 0;
    const covers = Math.round(Math.max(0, avgTickets * 14) * factor);
    const revenue = Math.round(avgRevenue * Math.max(1, covers * 0.9));
    hours.push({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      covers,
      revenue,
      patties: Math.ceil(covers * 1.35),
      buns: Math.ceil(covers * 0.95),
      friesKg: Number((covers * 0.2).toFixed(1)),
      staff: Math.max(2, Math.ceil(covers / 18)),
    });
  }

  const sampled = [...buckets.values()].reduce((n, b) => n + b.weight, 0);
  const confidence = Math.min(0.97, 0.55 + Math.log10(1 + sampled) / 4);
  return { hours, factor, matched, confidence: Number(confidence.toFixed(2)) };
}

/* ============================================================
 * 4. P&L ROLL-UP
 * ============================================================ */

export type PnlSummary = {
  revenue: number;
  revenueBudget: number;
  revenueLy: number;
  cogs: number;
  cogsBudget: number;
  cogsLy: number;
  labor: number;
  laborBudget: number;
  laborLy: number;
  opex: number;
  opexBudget: number;
  opexLy: number;
  ebitda: number;
  ebitdaBudget: number;
  ebitdaLy: number;
};

export function rollUpPnl(rows: PnlRow[]): PnlSummary {
  const sum = (key: keyof PnlRow) =>
    rows.reduce((n, r) => n + Number(r[key] as number | string), 0);
  const revenue = sum("revenue_actual");
  const revenueBudget = sum("revenue_budget");
  const revenueLy = sum("revenue_ly");
  const cogs = sum("cogs_actual");
  const cogsBudget = sum("cogs_budget");
  const cogsLy = sum("cogs_ly");
  const labor = sum("labor_actual");
  const laborBudget = sum("labor_budget");
  const laborLy = sum("labor_ly");
  const opex = sum("opex_actual");
  const opexBudget = sum("opex_budget");
  const opexLy = sum("opex_ly");
  return {
    revenue,
    revenueBudget,
    revenueLy,
    cogs,
    cogsBudget,
    cogsLy,
    labor,
    laborBudget,
    laborLy,
    opex,
    opexBudget,
    opexLy,
    ebitda: revenue - cogs - labor - opex,
    ebitdaBudget: revenueBudget - cogsBudget - laborBudget - opexBudget,
    ebitdaLy: revenueLy - cogsLy - laborLy - opexLy,
  };
}

export const fmtMoney = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);

export const fmtCompact = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    Number.isFinite(n) ? n : 0,
  );

export const pct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
