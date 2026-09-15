import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { LoadingRows, PageHeader, Panel } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { useScope } from "@/hooks/use-scope";
import { fmtMoney, pct, rollUpPnl } from "@/lib/engines";
import { usePnl } from "@/lib/queries";
import type { PnlRow } from "@/lib/types";

export const Route = createFileRoute("/dashboard/pnl")({
  component: PnlPage,
});

type LineKey = "revenue" | "cogs" | "labor" | "opex" | "ebitda";

const LINES: { key: LineKey; label: string; invert: boolean }[] = [
  { key: "revenue", label: "Revenue", invert: false },
  { key: "cogs", label: "Cost of goods sold", invert: true },
  { key: "labor", label: "Labour", invert: true },
  { key: "opex", label: "Operating expenses", invert: true },
  { key: "ebitda", label: "EBITDA", invert: false },
];

function PnlPage() {
  const scope = useScope();
  const { data: pnl, isLoading } = usePnl();
  const [periodType, setPeriodType] = useState<"monthly" | "weekly">("monthly");

  const rows = useMemo(
    () =>
      (pnl ?? []).filter(
        (r) => scope.locationIds.has(r.location_id) && r.period_type === periodType,
      ),
    [pnl, scope.locationIds, periodType],
  );

  const periods = useMemo(
    () => [...new Set(rows.map((r) => r.period_start))].sort().reverse(),
    [rows],
  );
  const [period, setPeriod] = useState<string | null>(null);
  const activePeriod = period && periods.includes(period) ? period : (periods[0] ?? null);

  const periodRows = rows.filter((r) => r.period_start === activePeriod);
  const summary = rollUpPnl(periodRows);

  const value = (key: LineKey, series: "" | "Budget" | "Ly") =>
    summary[`${key}${series}` as keyof typeof summary] as number;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profit & loss"
        subtitle="Top-to-bottom actuals against budget and last year, consolidated across every restaurant in your authority."
        action={
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg border border-border p-0.5">
              {(["monthly", "weekly"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPeriodType(t)}
                  className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
                    periodType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <select
              value={activePeriod ?? ""}
              onChange={(e) => setPeriod(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm"
            >
              {periods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {isLoading ? (
        <LoadingRows rows={6} />
      ) : periodRows.length === 0 ? (
        <Panel>
          <p className="text-sm text-muted-foreground">
            No {periodType} ledger rows for your restaurants yet.
          </p>
        </Panel>
      ) : (
        <>
          <Panel title={`Consolidated P&L — ${activePeriod}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2">Line</th>
                    <th className="py-2 text-right">Actual</th>
                    <th className="py-2 text-right">Budget</th>
                    <th className="py-2 text-right">Var vs budget</th>
                    <th className="py-2 text-right">Last year</th>
                    <th className="py-2 text-right">Var vs LY</th>
                    <th className="py-2 text-right">% of revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {LINES.map((line) => {
                    const actual = value(line.key, "");
                    const budget = value(line.key, "Budget");
                    const ly = value(line.key, "Ly");
                    const vb = variance(actual, budget, line.invert);
                    const vl = variance(actual, ly, line.invert);
                    return (
                      <tr
                        key={line.key}
                        className={`border-b border-border/60 ${
                          line.key === "ebitda" ? "font-semibold" : ""
                        }`}
                      >
                        <td className="py-2.5">{line.label}</td>
                        <td className="py-2.5 text-right tabular-nums">
                          {fmtMoney(actual, scope.currency)}
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                          {fmtMoney(budget, scope.currency)}
                        </td>
                        <td className={`py-2.5 text-right tabular-nums ${tone(vb)}`}>
                          {vb.toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                          {fmtMoney(ly, scope.currency)}
                        </td>
                        <td className={`py-2.5 text-right tabular-nums ${tone(vl)}`}>
                          {vl.toFixed(1)}%
                        </td>
                        <td className="py-2.5 text-right tabular-nums">
                          {summary.revenue ? pct(actual / summary.revenue) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="By restaurant" hint="Same period, ranked by EBITDA contribution.">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2">Restaurant</th>
                    <th className="py-2 text-right">Revenue</th>
                    <th className="py-2 text-right">vs budget</th>
                    <th className="py-2 text-right">COGS %</th>
                    <th className="py-2 text-right">Labour %</th>
                    <th className="py-2 text-right">EBITDA</th>
                  </tr>
                </thead>
                <tbody>
                  {byLocation(periodRows, scope.locations.map((l) => l.id)).map(
                    ({ locationId, rows: locRows }) => {
                      const s = rollUpPnl(locRows);
                      const loc = scope.byId(locationId);
                      const vb = variance(s.revenue, s.revenueBudget, false);
                      return (
                        <tr key={locationId} className="border-b border-border/60">
                          <td className="py-2.5 font-medium">
                            {loc?.name ?? locationId}
                            <span className="ml-2 text-xs text-muted-foreground">
                              {loc?.country}
                            </span>
                          </td>
                          <td className="py-2.5 text-right tabular-nums">
                            {fmtMoney(s.revenue, loc?.currency ?? scope.currency)}
                          </td>
                          <td className={`py-2.5 text-right tabular-nums ${tone(vb)}`}>
                            {vb.toFixed(1)}%
                          </td>
                          <td className="py-2.5 text-right tabular-nums">
                            {s.revenue ? pct(s.cogs / s.revenue) : "—"}
                          </td>
                          <td className="py-2.5 text-right tabular-nums">
                            {s.revenue ? pct(s.labor / s.revenue) : "—"}
                          </td>
                          <td className="py-2.5 text-right tabular-nums">
                            {fmtMoney(s.ebitda, loc?.currency ?? scope.currency)}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function byLocation(rows: PnlRow[], order: string[]) {
  const map = new Map<string, PnlRow[]>();
  for (const r of rows) map.set(r.location_id, [...(map.get(r.location_id) ?? []), r]);
  return order
    .filter((id) => map.has(id))
    .map((id) => ({ locationId: id, rows: map.get(id)! }));
}

function variance(actual: number, base: number, invert: boolean) {
  if (!base) return 0;
  const v = ((actual - base) / base) * 100;
  return invert ? -v : v;
}

function tone(v: number) {
  return v >= 0 ? "text-success" : "text-destructive";
}

export { Button };
