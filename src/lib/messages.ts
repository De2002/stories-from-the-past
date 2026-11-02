import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type Message = { id: string; sender_id: string; recipient_id: string; body: string; is_read: boolean; created_at: string };
type MiniProfile = { id: string; username: string; display_name: string; avatar_url: string | null };

/** Groups messages into one conversation per other person, newest first. */
export function groupConversations(messages: Message[], me: string) {
  const map = new Map<string, { otherId: string; last: Message; unread: number }>();
  for (const m of [...messages].sort((a, b) => b.created_at.localeCompare(a.created_at))) {
    const otherId = m.sender_id === me ? m.recipient_id : m.sender_id;
    const c = map.get(otherId) ?? { otherId, last: m, unread: 0 };
    if (m.recipient_id === me && !m.is_read) c.unread++;
    map.set(otherId, c);
  }
  return [...map.values()];
}

/** Keeps message queries fresh while signed in. */
export function useMessagesLive() {
  const { user } = useAuth();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`dm-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => qc.invalidateQueries({ queryKey: ["messages"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);
}

export function useInbox() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["messages", "inbox", user?.id], enabled: !!user, refetchInterval: 60000, queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase.from("messages").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    const convos = groupConversations(data as Message[], user.id);
    const ids = convos.map(c => c.otherId);
    const { data: profs } = ids.length ? await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", ids) : { data: [] };
    const byId = new Map(((profs ?? []) as MiniProfile[]).map(p => [p.id, p]));
    return convos.map(c => ({ ...c, profile: byId.get(c.otherId) ?? null }));
  } });
}
