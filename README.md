# Restaurant OS Elite

MASTER DEPLOYMENT WORK ORDER: THE #1 GLOBAL RESTAURANT OS

SYSTEM INSTRUCTION: Act as an elite AI Software Architect. You are commanded to build, wire, and deploy the worldâ€™s most advanced multi-unit restaurant enterprise management platform. Use React, Tailwind CSS, and wire a complete Supabase backend automatically. Integrate the attached ZIP file's foundational logic. Execute every module below flawlessly into a single, deployable, live web application. Do not halt until the entire system is built and ready to publish.

1. SUPABASE DATABASE SCHEMA (AUTOCONFIGURE IMMEDIATELY): Create the following linked tables:

users: id, name, role (Strict Enum: Restaurant Manager, Area Manager, Operations Manager, Country Manager, HR Officer, HR Supervisor, HR Manager, Head HR, MD, COO, CEO, System Owner), location_id.

sales_pos: id, location_id, ticket_data (JSONB), total_amount, timestamp.

inventory_ledger: id, location_id, item_name, theoretical_qty, actual_qty, variance_alert (Boolean).

cctv_audits: id, location_id, violation_type, severity (Minor, Critical), status, escalation_level, timestamp.

hr_disciplinary: id, employee_id, audit_id, warning_level, status.

2. THE "GOD-MODE" MASTER AI CHAT ENGINEER (OWNER EXCLUSIVE):

Build a persistent, omnipotent Chat UI pinned to the dashboard accessible only to the 'System Owner'.

Function: This AI must simulate the ability to command the entire system. It can pull any financial report, alter RBAC permissions, rewrite system parameters, and act as a virtual CFO/CTO.

Sub-Agents: For all lower roles, provide a restricted AI chat assistant that can only query data and perform tasks strictly within their specific role and location_id limitations.

3. DASHBOARD UI/UX (ASSIMILATING TOP 50 SAAS STANDARDS):

Design Language: Ultra-modern, dark/light mode toggle, flawless mobile/tablet/desktop responsiveness.

Executive View (CEO/Owner): A macro-dashboard highlighting Total Revenue vs. Budget, Real-time COGS, Global Labor %, and Critical Escalation Alerts.

Drill-Down Capability: The ability to click any metric and drill down from the Country level, to the Area level, down to a single Cashier's void ticket at a specific location.

P&L Engine UI: A dedicated tab generating Top-to-Bottom P&L reports (Weekly/Monthly) comparing Actuals vs. Budget vs. Last Year's Sales.

4. MICRO-VARIANCE INVENTORY ALGORITHM (THEFT DETECTION):

Build the core inventory logic: The system must cross-reference raw ingredient depletion against POS ticket modifiers.

Hardcoded Test Logic: If a POS ticket reads "1 Burger + 4 Extra Patties", the system must calculate the depletion of 5 total patties but only 1 bun. If actual physical bun inventory shows a variance of -3 (indicating 3 standard burgers were handed out for free or stolen), trigger an immediate CRITICAL THEFT ANOMALY alert on the dashboard.

5. AUTOMATED CCTV AUDIT & TIME-BOUND SLA ESCALATION:

Build an "Audit Alerts" module simulating CCTV AI detections (Safety, Theft, Speed of Service).

Escalation Logic Matrix (Wire this exactly):

0 Hours: Alert hits Restaurant Manager dashboard.

48 Hours Unresolved: Auto-escalates to Area Manager & alerts HR Officer.

96 Hours Unresolved: Auto-escalates to Operations Manager & alerts HR Manager.

Critical Bypass: If tagged 'Theft' or 'Cash Manipulation', bypass all lower management and instantly alert Upper Management (MD/COO) and Head HR.

6. PREDICTIVE FORECASTING & LABOR SCHEDULING:

Build a "Prep & Consumption" module.

Logic: It must display hourly kitchen prep charts (how many patties/buns to prep per hour) based on historical peak/slow hours.

Holiday Algorithm: Add a feature to automatically adjust these forecasts based on imported external events (Ramadan, Eid, Puja, local holidays) by cross-referencing previous year data for those specific events.

EXECUTION COMMAND: Read the ZIP file, apply this entire architecture, generate the Supabase backend, build all UI components, and output the fully functional, clickable, live application ready for immediate publishing.



Do everything with 10x extra powerful and strongest, perfectly and appropriately. Should be this apps/website number 1 in entire planet. Involve all top tire multi experts in entire planet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/155c3f49-b34f-4658-8de3-840828f64ede).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
