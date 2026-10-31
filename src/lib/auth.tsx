import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Ctx = { user: User | null; ready: boolean };
const AuthCtx = createContext<Ctx>({ user: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ user: null, ready: false });
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setState({ user: data.user, ready: true }));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setState({ user: session?.user ?? null, ready: true });
      qc.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
