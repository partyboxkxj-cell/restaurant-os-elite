export const ROLES = [
  "Restaurant Manager",
  "Area Manager",
  "Operations Manager",
  "Country Manager",
  "HR Officer",
  "HR Supervisor",
  "HR Manager",
  "Head HR",
  "MD",
  "COO",
  "CEO",
  "System Owner",
] as const;

export type AppRole = (typeof ROLES)[number];

/** Authority tier: higher number = wider command. */
export const ROLE_TIER: Record<AppRole, number> = {
  "Restaurant Manager": 1,
  "Area Manager": 2,
  "Operations Manager": 3,
  "Country Manager": 4,
  "HR Officer": 1,
  "HR Supervisor": 2,
  "HR Manager": 3,
  "Head HR": 4,
  MD: 5,
  COO: 5,
  CEO: 6,
  "System Owner": 7,
};

export type Scope = "location" | "area" | "country" | "global";

export function scopeFor(role: AppRole): Scope {
  switch (role) {
    case "Restaurant Manager":
    case "HR Officer":
      return "location";
    case "Area Manager":
    case "HR Supervisor":
      return "area";
    case "Operations Manager":
    case "HR Manager":
      return "country";
    default:
      return "global";
  }
}

export const HR_ROLES: AppRole[] = ["HR Officer", "HR Supervisor", "HR Manager", "Head HR"];

export function isExecutive(role: AppRole) {
  return ROLE_TIER[role] >= 5;
}

export function isOwner(role: AppRole) {
  return role === "System Owner";
}

export type Capability =
  | "view_global_pnl"
  | "view_hr"
  | "resolve_audit"
  | "edit_budget"
  | "god_mode"
  | "manage_rbac";

export function can(role: AppRole, capability: Capability): boolean {
  switch (capability) {
    case "god_mode":
    case "manage_rbac":
      return isOwner(role);
    case "view_global_pnl":
      return ROLE_TIER[role] >= 3 || isOwner(role);
    case "edit_budget":
      return ROLE_TIER[role] >= 4;
    case "view_hr":
      return HR_ROLES.includes(role) || ROLE_TIER[role] >= 5;
    case "resolve_audit":
      return true;
    default:
      return false;
  }
}

export function roleBlurb(role: AppRole): string {
  const scope = scopeFor(role);
  const map: Record<Scope, string> = {
    location: "single restaurant",
    area: "area portfolio",
    country: "country portfolio",
    global: "global enterprise",
  };
  return `${role} · ${map[scope]} visibility`;
}
