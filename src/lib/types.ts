import type { AppRole } from "./rbac";

export type Location = {
  id: string;
  code: string;
  name: string;
  city: string;
  area: string;
  country: string;
  currency: string;
};

export type TicketModifier = { name: string; qty: number };
export type TicketItem = {
  sku: string;
  name: string;
  qty: number;
  modifiers?: TicketModifier[];
};
export type TicketData = { items?: TicketItem[]; channel?: string };

export type Sale = {
  id: string;
  location_id: string;
  cashier: string;
  ticket_no: string;
  ticket_data: TicketData;
  total_amount: number;
  voided: boolean;
  discount_amount: number;
  timestamp: string;
};

export type InventoryRow = {
  id: string;
  location_id: string;
  item_name: string;
  unit: string;
  unit_cost: number;
  theoretical_qty: number;
  actual_qty: number;
  variance_alert: boolean;
  period_date: string;
};

export type AuditRow = {
  id: string;
  location_id: string;
  violation_type: string;
  category: string;
  description: string;
  severity: "Minor" | "Critical";
  status: "Open" | "Acknowledged" | "In Progress" | "Resolved" | "Closed";
  escalation_level: number;
  assigned_role: AppRole;
  confidence: number;
  camera: string;
  financial_impact: number;
  resolved_at: string | null;
  timestamp: string;
};

export type HrRow = {
  id: string;
  employee_id: string;
  employee_name: string;
  location_id: string | null;
  audit_id: string | null;
  warning_level: string;
  status: string;
  notes: string;
  created_at: string;
};

export type PnlRow = {
  id: string;
  location_id: string;
  period_start: string;
  period_type: string;
  revenue_actual: number;
  revenue_budget: number;
  revenue_ly: number;
  cogs_actual: number;
  cogs_budget: number;
  cogs_ly: number;
  labor_actual: number;
  labor_budget: number;
  labor_ly: number;
  opex_actual: number;
  opex_budget: number;
  opex_ly: number;
};

export type CalendarEvent = {
  id: string;
  name: string;
  country: string;
  start_date: string;
  end_date: string;
  multiplier: number;
};

export type Profile = {
  id: string;
  name: string;
  email: string | null;
  location_id: string | null;
};
