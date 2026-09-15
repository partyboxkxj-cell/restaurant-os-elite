import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  BrainCircuit,
  Gauge,
  LineChart,
  LogOut,
  Menu,
  ShieldAlert,
  Timer,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { AiConsole } from "@/components/dashboard/ai-console";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useScope } from "@/hooks/use-scope";
import { supabase } from "@/integrations/supabase/client";
import { can, roleBlurb } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Command Center — RestoSentinel" },
      {
        name: "description",
        content:
          "Live multi-unit restaurant command center: revenue vs budget, COGS and labour, theft anomalies, CCTV escalations and prep forecasting.",
      },
      { property: "og:title", content: "RestoSentinel Command Center" },
      {
        property: "og:description",
        content: "Every restaurant, every shift, every anomaly — in one command center.",
      },
    ],
  }),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Overview", icon: Gauge, exact: true },
  { to: "/dashboard/pnl", label: "P&L", icon: LineChart },
  { to: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  { to: "/dashboard/audits", label: "CCTV Audits", icon: Timer },
  { to: "/dashboard/hr", label: "HR Cases", icon: Users, capability: "view_hr" as const },
  { to: "/dashboard/forecast", label: "Forecast", icon: ShieldAlert },
];

function DashboardLayout() {
  const scope = useScope();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [navOpen, setNavOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);

  useEffect(() => {
    if (!scope.loading && !scope.signedIn) {
      navigate({ to: "/auth" });
    }
  }, [scope.loading, scope.signedIn, navigate]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (scope.loading || !scope.signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Securing session…
        </div>
      </div>
    );
  }

  const links = NAV.filter((item) => !item.capability || can(scope.role, item.capability));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-[1600px]">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-sidebar-border bg-sidebar p-4 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
            navOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between">
            <Link to="/" className="font-display text-lg font-semibold tracking-tight">
              Resto<span className="text-primary">Sentinel</span>
            </Link>
            <button
              type="button"
              className="lg:hidden"
              onClick={() => setNavOpen(false)}
              aria-label="Close navigation"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{scope.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{roleBlurb(scope.role)}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              {scope.home ? `${scope.home.code} · ${scope.home.city}` : "Group-wide access"}
            </p>
          </div>

          <nav className="mt-6 space-y-1">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact ?? false }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="absolute inset-x-4 bottom-4 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => setConsoleOpen(true)}
            >
              <BrainCircuit className="size-4" />
              {can(scope.role, "god_mode") ? "God-Mode Console" : "AI Assistant"}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth" });
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </aside>

        {navOpen ? (
          <button
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden"
            onClick={() => setNavOpen(false)}
          />
        ) : null}

        {/* Main */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden"
                onClick={() => setNavOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
              <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                {scope.locations.length} restaurant{scope.locations.length === 1 ? "" : "s"} in
                view
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="gap-2"
                onClick={() => setConsoleOpen(true)}
              >
                <BrainCircuit className="size-4" />
                <span className="hidden sm:inline">Ask AI</span>
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>

      <AiConsole open={consoleOpen} onOpenChange={setConsoleOpen} />
    </div>
  );
}
