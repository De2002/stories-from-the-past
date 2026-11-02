import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMessagesLive, type Message } from "@/lib/messages";
import { Avatar } from "@/components/PostImage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { timeAgo } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/messages/$username")({
  head: ({ params }) => ({ meta: [
    { title: `Chat with @${params.username} — LeBeHo` }, { name: "description", content: `Private conversation with @${params.username} on LeBeHo.` },
    { property: "og:title", content: `Chat with @${params.username} — LeBeHo` }, { property: "og:description", content: `Private conversation with @${params.username} on LeBeHo.` },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Thread,
});

function Thread() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  useMessagesLive();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const other = useQuery({ queryKey: ["profileMini", username], queryFn: async () =>
    (await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("username", username).maybeSingle()).data });
  const otherId = other.data?.id;
  const thread = useQuery({ queryKey: ["messages", "thread", user?.id, otherId], enabled: !!user && !!otherId, queryFn: async () => {
    const { data, error } = await supabase.from("messages").select("*")
      .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${user!.id})`)
      .order("created_at").limit(500);
    if (error) throw error;
    return data as Message[];
  } });

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
    if (user && otherId && thread.data?.some(m => m.recipient_id === user.id && !m.is_read)) {
      supabase.from("messages").update({ is_read: true }).eq("recipient_id", user.id).eq("sender_id", otherId).eq("is_read", false)
        .then(() => qc.invalidateQueries({ queryKey: ["messages", "inbox"] }));
    }
  }, [thread.data, user, otherId, qc]);

  const send = async () => {
    const body = text.trim();
    if (!body || !user || !otherId) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({ sender_id: user.id, recipient_id: otherId, body: body.slice(0, 2000) });
    setSending(false);
    if (error) { toast.error("Couldn't send message"); return; }
    setText("");
    qc.invalidateQueries({ queryKey: ["messages"] });
  };

  if (other.isLoading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!other.data) return <p className="p-8">This person couldn't be found.</p>;
  const name = other.data.display_name || other.data.username;
  const isSelf = other.data.id === user?.id;

  return <div className="flex min-h-[calc(100dvh-8rem)] flex-col">
    <div className="sticky top-14 z-10 flex items-center gap-3 border-b border-border bg-background px-3 py-2">
      <Button asChild variant="ghost" size="icon"><Link to="/messages" aria-label="Back to messages"><ArrowLeft /></Link></Button>
      <Link to="/u/$username" params={{ username }} className="flex items-center gap-2"><Avatar name={name} url={other.data.avatar_url} size={32} /><span className="font-medium">{name}</span></Link>
    </div>
    <div className="flex-1 space-y-2 px-4 py-4">
      {thread.data?.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Say hello to {name}.</p>}
      {thread.data?.map(m => {
        const mine = m.sender_id === user?.id;
        return <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            <p className="whitespace-pre-wrap break-words">{m.body}</p>
            <p className="mt-0.5 text-[10px] opacity-70">{timeAgo(m.created_at)}</p>
          </div>
        </div>;
      })}
      <div ref={end} />
    </div>
    {!isSelf && <form className="sticky bottom-16 flex items-end gap-2 border-t border-border bg-background p-3" onSubmit={e => { e.preventDefault(); send(); }}>
      <Textarea value={text} onChange={e => setText(e.target.value)} maxLength={2000} rows={1} placeholder="Write a message…" className="min-h-10 resize-none"
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
      <Button type="submit" size="icon" disabled={sending || !text.trim()} aria-label="Send"><Send /></Button>
    </form>}
  </div>;
}
