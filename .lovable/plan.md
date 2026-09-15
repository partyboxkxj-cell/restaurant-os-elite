# Finish RestoSentinel — Dashboard, Modules, AI Console

Nothing already built gets removed or rebuilt. The backend, seeded data across 10 restaurants in 5 countries, sign-in, design system, landing page, role rules and the three engines (theft micro-variance, escalation matrix, forecasting) all stay exactly as they are. This adds the missing screens on top.

## What gets built

**1. Protected dashboard shell**
Sign-in gate, sidebar navigation, role badge, home-restaurant indicator, dark/light toggle, fully responsive on phone, tablet and desktop. Anyone not signed in is sent to the sign-in page.

**2. Executive overview (home of the dashboard)**
- Total Revenue vs Budget vs Last Year, live COGS %, labour %, EBITDA
- Critical escalation alerts and open theft anomalies at the top
- Drill-down: click any number to go Country → Area → Restaurant → individual cashier and void ticket
- Every figure respects the signed-in person's visibility scope

**3. P&L page**
Weekly and monthly, top-to-bottom line items: Revenue, COGS, Labour, Opex, EBITDA — Actuals vs Budget vs Last Year with variance colouring and per-restaurant breakdown.

**4. Inventory page**
Micro-variance engine output: theoretical depletion from till tickets versus counted stock, with the "1 Burger + 4 Extra Patties" rule applied, CRITICAL THEFT ANOMALY cards, value at risk, and the recommended action for each finding.

**5. CCTV audits page**
Live countdown per case against the escalation clock (0h Restaurant Manager, 48h Area Manager + HR Officer, 96h Operations Manager + HR Manager; theft and cash manipulation jump straight to MD, COO and Head HR). Breached cases highlighted; status can be moved through the workflow.

**6. HR page**
Disciplinary cases linked to their audit, warning level and status. Visible only to HR roles and executives.

**7. Forecast page**
Hourly Prep & Consumption charts — covers, patties, buns, fries, staffing — with occasion multipliers (Ramadan, Eid, Puja, national holidays, Christmas, Chinese New Year) and a confidence indicator.

**8. AI command console**
Slide-over chat pinned to the dashboard. System Owner gets the unrestricted console (pull any report, explain variances, act as virtual CFO/CTO); every other role gets an assistant limited server-side to their own scope and restaurant. Conversation history saved.

Credit note: items 1–7 use no AI credits at all. Only the console in item 8 spends anything, and only when someone actually sends a message. If you add a Google AI Studio key, the console bills your Google quota instead; without a key it falls back to the built-in AI.

**9. Verification**
Build check, then a real browser pass: sign in, open every page, drill down, and send one chat message.

## Then: the Cloud work order
Once the app is finished and verified, I will write a separate detailed work order document covering the next expansion phase — scale, integrations, revenue features, hardware and infrastructure — for you to review with ChatGPT before any of it is started.

## Technical notes
- New routes under `src/routes/dashboard/*`, all behind an auth gate; existing `index.tsx` and `auth.tsx` untouched.
- Pages consume the existing `queries.ts` hooks and `engines.ts` functions; no engine rewrites.
- Chat runs through a server route so the API key never reaches the browser; role scope is enforced server-side before any data enters the prompt.
- Charts use the existing shadcn chart component; colours from the existing design tokens only.
- No database schema changes.
