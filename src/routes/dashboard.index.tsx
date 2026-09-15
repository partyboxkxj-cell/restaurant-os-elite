import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ShieldAlert, Timer } from "lucide-react";
import { useMemo, useState } from "react";

import {
  EmptyState,
  LoadingRows,
  PageHeader,
  Panel,
  SeverityBadge,
  StatCard,
} from "@/components/dashboard/primitives";
import { useScope } from "@/hooks/use-scope";
import { detectVariance, escalate, fmtMoney, pct, rollUpPnl } from "@/lib/engines";
import { useAudits, useInventory, usePnl, useSales } from "@/lib/queries";
import type { Location, PnlRow, Sale } from "@/lib/types";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

type Level = "group" | "country" | "area" | "location";

function Overview() {
  const scope = useScope();
  const { data: pnl, isLoading: pnlLoading } = usePnl();
  const { data: audits } = useAudits();
  const { data: inventory } = useInventory();
  const { data: sales } = useSales();

  const [country, setCountry] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  const level: Level = locationId ? "location" : area ? "area" : country ? "country" : "group";

  const scoped = useMemo(() => {
    const locs = scope.locations.filter(
      (l) =>
        (!country || l.country === country) &&
        (!area || l.area === area) &&
        (!locationId || l.id === locationId),
    );
    const ids = new Set(locs.map((l) => l.id));
    const period = latestPeriod(pnl ?? []);
    const rows = (pnl ?? []).filter(
      (r) => ids.has(r.location_id) && r.period_type === "monthly" && r.period_start === period,
    );
    return { locs, ids, rows, period };
  }, [scope.locations, pnl, country, area, locationId]);

  const summary = rollUpPnl(scoped.rows);
  const openAudits = (audits ?? []).filter(
    (a) => scoped.ids.has(a.location_id) && a.status !== "Resolved" && a.status !== "Closed",
  );
  const breached = openAudits.filter((a) => escalate(a).breached);
  const findings = useMemo(
    () =>
      detectVariance(
        (inventory ?? []).filter((r) => scoped.ids.has(r.location_id)),
        (sales ?? []).filter((s) => scoped.ids.has(s.location_id)),
        scope.locations,
      ),
    [inventory, sales, scoped.ids, scope.locations],
  );
  const critical = findings.filter((f) => f.severity === "Critical");

  const revenueVsBudget = safePct(summary.revenue, summary.revenueBudget);
  const revenueVsLy = safePct(summary.revenue, summary.revenueLy);

  const children = useMemo(() => {
    if (level === "group") return groupBy(scoped.locs, (l) => l.country);
    if (level === "country") return groupBy(scoped.locs, (l) => l.area);
    if (level === "area") return groupBy(scoped.locs, (l) => l.name);
    return [];
  }, [level, scoped.locs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive command center"
        subtitle={`Consolidated performance for ${scoped.locs.length} restaurant${
          scoped.locs.length === 1 ? "" : "s"
        } · period ${scoped.period ?? "—"}`}
      />

      {/* Drill-down breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm">
        <Crumb
          label="Group"
          active={level === "group"}
          onClick={() => {
            setCountry(null);
            setArea(null);
            setLocationId(null);
          }}
        />
        {country ? (
          <>
            <ChevronRight className="size-4 text-muted-foreground" />
            <Crumb
              label={country}
              active={level === "country"}
              onClick={() => {
                setArea(null);
                setLocationId(null);
              }}
            />
          </>
        ) : null}
        {area ? (
          <>
            <ChevronRight className="size-4 text-muted-foreground" />
            <Crumb
              label={area}
              active={level === "area"}
              onClick={() => setLocationId(null)}
            />
          </>
        ) : null}
        {locationId ? (
          <>
            <ChevronRight className="size-4 text-muted-foreground" />
            <Crumb label={scope.byId(locationId)?.name ?? "Restaurant"} active onClick={() => {}} />
          </>
        ) : null}
      </nav>

      {pnlLoading ? (
        <LoadingRows rows={2} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Revenue vs budget"
            value={fmtMoney(summary.revenue, scope.currency)}
            delta={revenueVsBudget}
            sub={`Budget ${fmtMoney(summary.revenueBudget, scope.currency)}`}
          />
          <StatCard
            label="COGS %"
            value={pct(ratio(summary.cogs, summary.revenue))}
            delta={
              ratio(summary.cogs, summary.revenue) * 100 -
              ratio(summary.cogsBudget, summary.revenueBudget) * 100
            }
            invert
            sub="vs budgeted food cost"
            tone={ratio(summary.cogs, summary.revenue) > 0.34 ? "warning" : "default"}
          />
          <StatCard
            label="Labour %"
            value={pct(ratio(summary.labor, summary.revenue))}
            delta={
              ratio(summary.labor, summary.revenue) * 100 -
              ratio(summary.laborBudget, summary.revenueBudget) * 100
            }
            invert
            sub="vs budgeted labour"
          />
          <StatCard
            label="EBITDA"
            value={fmtMoney(summary.ebitda, scope.currency)}
            delta={safePct(summary.ebitda, summary.ebitdaBudget)}
            sub={`Last year ${fmtMoney(summary.ebitdaLy, scope.currency)} · ${revenueVsLy.toFixed(1)}% rev vs LY`}
          />
        </div>
      )}

      {(critical.length > 0 || breached.length > 0) && (
        <Panel
          title="Critical escalation alerts"
          hint="Anything here is losing money or breaching an SLA right now."
          className="border-destructive/40"
        >
          <div className="space-y-3">
            {critical.slice(0, 3).map((f) => (
              <div key={f.id} className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldAlert className="size-4 text-destructive" />
                  <span className="font-display text-sm font-semibold">{f.headline}</span>
                  <SeverityBadge level={f.severity} />
                  <span className="ml-auto text-sm font-semibold tabular-nums text-destructive">
                    {fmtMoney(f.valueAtRisk, scope.currency)} at risk
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{f.narrative}</p>
                <Link
                  to="/dashboard/inventory"
                  className="mt-2 inline-block text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Open variance investigation →
                </Link>
              </div>
            ))}
            {breached.slice(0, 3).map((a) => {
              const esc = escalate(a);
              return (
                <div key={a.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-warning/40 bg-warning/5 p-3">
                  <Timer className="size-4 text-warning" />
                  <span className="text-sm font-medium">{a.violation_type}</span>
                  <span className="text-xs text-muted-foreground">
                    {scope.byId(a.location_id)?.name ?? "—"} · {esc.label}
                  </span>
                  <Link
                    to="/dashboard/audits"
                    className="ml-auto text-xs font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    Review →
                  </Link>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      {level !== "location" ? (
        <Panel
          title={
            level === "group" ? "By country" : level === "country" ? "By area" : "By restaurant"
          }
          hint="Click any row to drill down — country, area, restaurant, then cashier."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2">Segment</th>
                  <th className="py-2 text-right">Revenue</th>
                  <th className="py-2 text-right">Budget</th>
                  <th className="py-2 text-right">Var %</th>
                  <th className="py-2 text-right">COGS %</th>
                  <th className="py-2 text-right">Labour %</th>
                </tr>
              </thead>
              <tbody>
                {children.map(({ key, locations }) => {
                  const rows = scoped.rows.filter((r) =>
                    locations.some((l) => l.id === r.location_id),
                  );
                  const s = rollUpPnl(rows);
                  const variance = safePct(s.revenue, s.revenueBudget);
                  return (
                    <tr
                      key={key}
                      onClick={() => {
                        if (level === "group") setCountry(key);
                        else if (level === "country") setArea(key);
                        else setLocationId(locations[0]?.id ?? null);
                      }}
                      className="cursor-pointer border-b border-border/60 transition-colors hover:bg-accent/60"
                    >
                      <td className="py-2.5 font-medium">{key}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        {fmtMoney(s.revenue, scope.currency)}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                        {fmtMoney(s.revenueBudget, scope.currency)}
                      </td>
                      <td
                        className={`py-2.5 text-right tabular-nums ${
                          variance >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {variance.toFixed(1)}%
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {pct(ratio(s.cogs, s.revenue))}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        {pct(ratio(s.labor, s.revenue))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : (
        <CashierDrill
          location={scope.byId(locationId!) ?? null}
          sales={(sales ?? []).filter((s) => s.location_id === locationId)}
          currency={scope.currency}
        />
      )}
    </div>
  );
}

function CashierDrill({
  location,
  sales,
  currency,
}: {
  location: Location | null;
  sales: Sale[];
  currency: string;
}) {
  const cashiers = useMemo(() => {
    const map = new Map<
      string,
      { cashier: string; revenue: number; tickets: number; voids: number; discounts: number }
    >();
    for (const s of sales) {
      const row = map.get(s.cashier) ?? {
        cashier: s.cashier,
        revenue: 0,
        tickets: 0,
        voids: 0,
        discounts: 0,
      };
      row.tickets += 1;
      if (s.voided) row.voids += 1;
      else row.revenue += Number(s.total_amount);
      row.discounts += Number(s.discount_amount ?? 0);
      map.set(s.cashier, row);
    }
    return [...map.values()].sort((a, b) => b.voids - a.voids || b.revenue - a.revenue);
  }, [sales]);

  const voidTickets = sales.filter((s) => s.voided).slice(0, 12);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title={`Cashiers — ${location?.name ?? "Restaurant"}`} hint="Ranked by void exposure.">
        {cashiers.length === 0 ? (
          <EmptyState message="No till activity in the loaded window." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2">Cashier</th>
                <th className="py-2 text-right">Tickets</th>
                <th className="py-2 text-right">Voids</th>
                <th className="py-2 text-right">Discounts</th>
                <th className="py-2 text-right">Net sales</th>
              </tr>
            </thead>
            <tbody>
              {cashiers.map((c) => (
                <tr key={c.cashier} className="border-b border-border/60">
                  <td className="py-2 font-medium">{c.cashier}</td>
                  <td className="py-2 text-right tabular-nums">{c.tickets}</td>
                  <td
                    className={`py-2 text-right tabular-nums ${c.voids > 0 ? "text-destructive" : ""}`}
                  >
                    {c.voids}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtMoney(c.discounts, currency)}
                  </td>
                  <td className="py-2 text-right tabular-nums">{fmtMoney(c.revenue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Void tickets" hint="Every voided ticket, item-level, for investigation.">
        {voidTickets.length === 0 ? (
          <EmptyState message="No voided tickets in this window — clean till." />
        ) : (
          <ul className="space-y-2">
            {voidTickets.map((t) => (
              <li key={t.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{t.ticket_no}</span>
                  <span className="font-medium">{t.cashier}</span>
                  <span className="ml-auto tabular-nums text-destructive">
                    {fmtMoney(Number(t.total_amount), currency)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(t.timestamp).toLocaleString()} ·{" "}
                  {(t.ticket_data?.items ?? [])
                    .map(
                      (i) =>
                        `${i.qty}× ${i.name}${
                          i.modifiers?.length
                            ? ` (${i.modifiers.map((m) => `${m.qty}× ${m.name}`).join(", ")})`
                            : ""
                        }`,
                    )
                    .join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Crumb({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-2 py-1 transition-colors ${
        active ? "bg-accent font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function groupBy(locations: Location[], key: (l: Location) => string) {
  const map = new Map<string, Location[]>();
  for (const l of locations) map.set(key(l), [...(map.get(key(l)) ?? []), l]);
  return [...map.entries()].map(([k, v]) => ({ key: k, locations: v }));
}

export function latestPeriod(rows: PnlRow[]) {
  const monthly = rows.filter((r) => r.period_type === "monthly");
  return monthly.length ? monthly.map((r) => r.period_start).sort().at(-1)! : null;
}

function ratio(a: number, b: number) {
  return b ? a / b : 0;
}

function safePct(actual: number, base: number) {
  return base ? ((actual - base) / base) * 100 : 0;
}
