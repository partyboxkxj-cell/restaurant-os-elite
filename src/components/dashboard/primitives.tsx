import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className,
  title,
  hint,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  hint?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-panel)] sm:p-5",
        className,
      )}
    >
      {title ? (
        <header className="mb-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </h2>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Delta({
  value,
  invert = false,
  suffix = "%",
}: {
  value: number;
  invert?: boolean;
  suffix?: string;
}) {
  const good = invert ? value <= 0 : value >= 0;
  const Icon = value === 0 ? Minus : value > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        good ? "text-success" : "text-destructive",
      )}
    >
      <Icon className="size-3.5" />
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  delta,
  invert,
  tone = "default",
  onClick,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number;
  invert?: boolean;
  tone?: "default" | "critical" | "warning" | "success";
  onClick?: () => void;
}) {
  const toneRing =
    tone === "critical"
      ? "border-destructive/50"
      : tone === "warning"
        ? "border-warning/50"
        : tone === "success"
          ? "border-success/50"
          : "border-border";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group w-full rounded-xl border bg-card p-4 text-left transition-all",
        toneRing,
        onClick ? "hover:-translate-y-0.5 hover:shadow-[var(--shadow-glow)]" : "cursor-default",
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {typeof delta === "number" ? <Delta value={delta} invert={invert} /> : null}
        {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
      </div>
    </button>
  );
}

export function SeverityBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Critical: "bg-destructive/15 text-destructive border-destructive/40",
    High: "bg-warning/15 text-warning border-warning/40",
    Watch: "bg-muted text-muted-foreground border-border",
    Minor: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        map[level] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {level}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/60" />
      ))}
    </div>
  );
}
