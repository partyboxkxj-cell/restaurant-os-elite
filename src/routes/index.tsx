import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Boxes,
  BrainCircuit,
  LineChart,
  ShieldAlert,
  Timer,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RestoSentinel — The Multi-Unit Restaurant Enterprise OS" },
      {
        name: "description",
        content:
          "Run every restaurant from one command center: real-time P&L vs budget, micro-variance theft detection, CCTV audit escalation with SLA timers and AI demand forecasting.",
      },
      { property: "og:title", content: "RestoSentinel — Restaurant Enterprise OS" },
      {
        property: "og:description",
        content:
          "Live P&L, theft detection, CCTV audit escalation and AI forecasting for multi-unit restaurant groups.",
      },
    ],
  }),
  component: Landing,
});

const PILLARS = [
  {
    icon: LineChart,
    title: "Executive P&L engine",
    body: "Top-to-bottom weekly and monthly P&L comparing actuals against budget and last year, from group down to a single till.",
  },
  {
    icon: Boxes,
    title: "Micro-variance theft detection",
    body: "Recipe-level depletion is reconciled against POS modifiers, so free hand-outs surface as critical anomalies within the hour.",
  },
  {
    icon: Timer,
    title: "Time-bound SLA escalation",
    body: "Audits move themselves: 48h to Area Manager and HR Officer, 96h to Operations and HR Manager, theft bypasses straight to MD, COO and Head HR.",
  },
  {
    icon: BrainCircuit,
    title: "AI command console",
    body: "A god-mode assistant for the System Owner and role-scoped assistants for everyone else, wired to live operational data.",
  },
  {
    icon: Activity,
    title: "Prep & labour forecasting",
    body: "Hourly prep quantities and staffing built from comparable history, adjusted for Ramadan, Eid, Puja and local holidays.",
  },
  {
    icon: ShieldAlert,
    title: "Enterprise-grade access",
    body: "Twelve strict roles from Restaurant Manager to System Owner, each with its own data horizon enforced in the database.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <ShieldAlert className="size-5" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              RestoSentinel
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild>
              <Link to="/auth">Enter command center</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="grid-aurora">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            Live enterprise build · 10 locations · 5 countries
          </p>
          <h1 className="max-w-3xl text-4xl leading-[1.05] font-bold sm:text-6xl">
            One command center for every restaurant you operate.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            RestoSentinel fuses point of sale, inventory, CCTV audit intelligence, HR discipline
            and financial control into a single operating system — with AI that can answer for
            the whole estate or just your own store.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.title} className="panel p-6">
              <pillar.icon className="size-5 text-primary" />
              <h2 className="mt-4 text-lg font-semibold">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <p className="mx-auto max-w-7xl px-5 text-xs text-muted-foreground">
          RestoSentinel — multi-unit restaurant enterprise management.
        </p>
      </footer>
    </div>
  );
}
