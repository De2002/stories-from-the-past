import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { useInbox, useMessagesLive } from "@/lib/messages";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/PostImage";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({ meta: [
    { title: "Messages — LeBeHo" }, { name: "description", content: "Your private conversations with collectors on LeBeHo." },
    { property: "og:title", content: "Messages — LeBeHo" }, { property: "og:description", content: "Your private conversations with collectors on LeBeHo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Inbox,
});

function Inbox() {
  useMessagesLive();
  const inbox = useInbox();
  const { user } = useAuth();
  return <div className="py-6">
    <h1 className="px-4 text-3xl">Messages</h1>
    {inbox.isLoading && <p className="p-8 text-muted-foreground">Loading messages…</p>}
    {inbox.isError && <div className="p-8"><p>Couldn't load messages.</p><Button variant="outline" onClick={() => inbox.refetch()}>Try again</Button></div>}
    {inbox.data?.length === 0 && <div className="flex flex-col items-center gap-3 px-6 py-16 text-center"><MessageCircle className="h-9 w-9 text-sepia" /><h2 className="text-xl">No messages yet</h2><p className="text-sm text-muted-foreground">Open someone's profile and tap Message to start a conversation.</p></div>}
    <div className="mt-5 border-t border-border">{inbox.data?.filter(c => c.profile).map(c => {
      const p = c.profile!; const name = p.display_name || p.username;
      return <Link key={c.otherId} to="/messages/$username" params={{ username: p.username }} className={`flex items-center gap-3 border-b border-border px-4 py-4 ${c.unread ? "bg-secondary/50" : ""}`}>
        <Avatar name={name} url={p.avatar_url} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2"><p className="truncate font-medium">{name}</p><span className="shrink-0 text-xs text-muted-foreground">{timeAgo(c.last.created_at)}</span></div>
          <p className={`truncate text-sm ${c.unread ? "text-foreground" : "text-muted-foreground"}`}>{c.last.sender_id === user?.id ? "You: " : ""}{c.last.body}</p>
        </div>
        {c.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{c.unread}</span>}
      </Link>;
    })}</div>
  </div>;
}
