import { useMemo } from "react";

import { useAuthSession, useIdentity } from "@/hooks/use-session";
import { useLocations, visibleLocations } from "@/lib/queries";
import type { AppRole } from "@/lib/rbac";
import type { Location } from "@/lib/types";

export type ScopeState = {
  loading: boolean;
  signedIn: boolean;
  userId: string | undefined;
  role: AppRole;
  name: string;
  home: Location | null;
  locations: Location[];
  locationIds: Set<string>;
  currency: string;
  byId: (id: string) => Location | undefined;
};

/** Everything a dashboard page needs to render inside the user's authority. */
export function useScope(): ScopeState {
  const { session, loading: sessionLoading } = useAuthSession();
  const userId = session?.user?.id;
  const { data: identity, isLoading: identityLoading } = useIdentity(userId);
  const { data: allLocations, isLoading: locationsLoading } = useLocations();

  return useMemo(() => {
    const role = (identity?.role ?? "Restaurant Manager") as AppRole;
    const home = identity?.homeLocation ?? null;
    const locations = visibleLocations(allLocations ?? [], role, home);
    return {
      loading: sessionLoading || identityLoading || locationsLoading,
      signedIn: !!session,
      userId,
      role,
      name: identity?.profile?.name ?? session?.user?.email ?? "Operator",
      home,
      locations,
      locationIds: new Set(locations.map((l) => l.id)),
      currency: home?.currency ?? locations[0]?.currency ?? "USD",
      byId: (id: string) => locations.find((l) => l.id === id),
    };
  }, [
    session,
    sessionLoading,
    identity,
    identityLoading,
    allLocations,
    locationsLoading,
    userId,
  ]);
}
