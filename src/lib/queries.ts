import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./rbac";
import { scopeFor } from "./rbac";
import type {
  AuditRow,
  CalendarEvent,
  HrRow,
  InventoryRow,
  Location,
  PnlRow,
  Sale,
} from "./types";

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("locations").select("*").order("code");
      if (error) throw error;
      return (data ?? []) as Location[];
    },
    staleTime: 300_000,
  });
}

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_pos")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(3000);
      if (error) throw error;
      return (data ?? []) as unknown as Sale[];
    },
  });
}

export function useInventory() {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_ledger")
        .select("*")
        .order("item_name");
      if (error) throw error;
      return (data ?? []) as unknown as InventoryRow[];
    },
  });
}

export function useAudits() {
  return useQuery({
    queryKey: ["audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cctv_audits")
        .select("*")
        .order("timestamp", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AuditRow[];
    },
  });
}

export function useHrCases() {
  return useQuery({
    queryKey: ["hr"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hr_disciplinary")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as HrRow[];
    },
  });
}

export function usePnl() {
  return useQuery({
    queryKey: ["pnl"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pnl_periods")
        .select("*")
        .order("period_start", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as PnlRow[];
    },
  });
}

export function useCalendar() {
  return useQuery({
    queryKey: ["calendar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .order("start_date");
      if (error) throw error;
      return (data ?? []) as unknown as CalendarEvent[];
    },
    staleTime: 300_000,
  });
}

/** Locations this role may see, given their home restaurant. */
export function visibleLocations(
  all: Location[],
  role: AppRole,
  home: Location | null,
): Location[] {
  const scope = scopeFor(role);
  if (scope === "global" || !home) return all;
  if (scope === "country") return all.filter((l) => l.country === home.country);
  if (scope === "area") return all.filter((l) => l.area === home.area);
  return all.filter((l) => l.id === home.id);
}
