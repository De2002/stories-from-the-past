import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useAdminAccess() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["adminAccess", user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return false;
    const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (error) throw error;
    return data === true;
  } });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["notifications", user?.id], enabled: !!user, refetchInterval: 30000, queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase.from("notifications").select("*, actor:profiles!notifications_actor_id_fkey(username,display_name,avatar_url)").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return data ?? [];
  } });
}