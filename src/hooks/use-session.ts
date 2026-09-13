import { useQuery } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/rbac";
import { ROLE_TIER } from "@/lib/rbac";
import type { Location, Profile } from "@/lib/types";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, loading };
}

export type Identity = {
  profile: Profile | null;
  role: AppRole;
  homeLocation: Location | null;
};

export function useIdentity(userId: string | undefined) {
  return useQuery({
    queryKey: ["identity", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Identity> => {
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      const list = (roles ?? []).map((r) => r.role as AppRole);
      const role =
        list.sort((a, b) => ROLE_TIER[b] - ROLE_TIER[a])[0] ?? ("Restaurant Manager" as AppRole);
      let homeLocation: Location | null = null;
      if (profile?.location_id) {
        const { data } = await supabase
          .from("locations")
          .select("*")
          .eq("id", profile.location_id)
          .maybeSingle();
        homeLocation = (data as Location) ?? null;
      }
      return { profile: (profile as Profile) ?? null, role, homeLocation };
    },
  });
}
