# RestoSentinel — Finish the Build + Power AI Chat with Your Gemini Key

## What you need to do (one thing)

Your Gemini Pro subscription (the consumer app) does not include API access, so I cannot connect to it directly. Instead:

1. Go to **Google AI Studio** → https://aistudio.google.com → sign in → **Get API key** → create a free key.
2. Paste it into the secret prompt I will show you in chat (it gets stored securely, never visible in code or the browser).

The Gemini free API tier is generous and separate from Lovable credits. If you skip this, the chat console will use Lovable AI as a fallback — everything else works either way.

## What I will build

### 1. Finish the app (no AI credits consumed)

- **Protected dashboard shell** — sign-in gate, sidebar navigation, role badge, theme toggle, location scope indicator.
- **Executive overview** — Total Revenue vs Budget, COGS %, labor %, critical escalation alerts; click any metric to drill Country → Area → Location → single cashier/void ticket.
- **P&L tab** — weekly/monthly Actuals vs Budget vs Last Year, top to bottom, with variance coloring.
- **Inventory page** — micro-variance engine: theoretical depletion from POS tickets (1 Burger + 4 Extra Patties = 5 patties + 1 bun) vs actual counts; CRITICAL THEFT ANOMALY flagging.
- **CCTV Audits page** — SLA escalation matrix (0h Restaurant Manager → 48h Area Manager + HR Officer → 96h Ops Manager + HR Manager; Theft/Cash Manipulation bypass to MD/COO + Head HR), live countdowns, breach highlighting, status workflow.
- **HR page** — disciplinary cases linked to audits, warning levels (visible to HR roles and executives only).
- **Forecast page** — hourly Prep & Consumption charts (patties, buns, fries, staffing) with holiday multipliers (Ramadan 0.78, Eid, Puja, etc.) and confidence band.

All of this is seeded and ready in the database across 10 restaurants in 5 countries.

### 2. AI Command Console powered by your Gemini key

- Server route `src/routes/api/chat.ts` that calls the Gemini API with your stored key (model: Gemini Pro class, e.g. `gemini-2.5-pro`), falling back to Lovable AI if no key is set.
- **God-Mode** for System Owner: omnipotent console — pull any report, explain variances, virtual CFO/CTO answers, full data access.
- **Restricted assistant** for every other role: server-side filter limits answers to that role's scope and home location.
- Chat UI pinned to the dashboard (slide-over panel), conversation history saved in the existing `ai_messages` table.

### 3. Verify

- Build check, then a browser pass over sign-in → dashboard → each module, plus one real chat request through your Gemini key.

## Technical notes

- Gemini key stored as a server-side secret (`GEMINI_API_KEY`); read only inside the server route handler — never exposed to the browser.
- Role scoping enforced server-side: the route loads the caller's role + location and injects only permitted data into the prompt.
- No changes to existing tables; reuses `rbac.ts`, `engines.ts`, and the seeded dataset.
