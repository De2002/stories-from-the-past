import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useNotifications } from "@/lib/activity";
import { notificationTarget } from "@/lib/community";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/PostImage";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [
    { title: "Notifications — LeBeHo" }, { name: "description", content: "Your latest follows, comments and likes on LeBeHo." },
    { property: "og:title", content: "Notifications — LeBeHo" }, { property: "og:description", content: "Your latest follows, comments and likes on LeBeHo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: NotificationsPage,
});

function NotificationsPage() {
  const notices = useNotifications();
  const { user } = useAuth();
  const qc = useQueryClient();
  const read = async (id?: string) => {
    if (!user) return;
    let query = supabase.from("notifications").update({ is_read: true }).eq("recipient_id", user.id);
    if (id) query = query.eq("id", id);
    const { error } = await query;
    if (error) { toast.error("Couldn't mark notifications read"); return; }
    await qc.invalidateQueries({ queryKey: ["notifications"] });
  };
  return <div className="py-6"><div className="flex items-center justify-between gap-2 px-4"><h1 className="text-3xl">Notifications</h1><Button variant="ghost" size="icon" title="Mark all as read" aria-label="Mark all as read" disabled={!notices.data?.some(n=>!n.is_read)} onClick={()=>read()}><CheckCheck/></Button></div>
    {notices.isLoading&&<p className="p-8 text-muted-foreground">Loading notifications…</p>}
    {notices.isError&&<div className="p-8"><p>Couldn't load notifications.</p><Button variant="outline" onClick={()=>notices.refetch()}>Try again</Button></div>}
    {notices.data?.length===0&&<div className="flex flex-col items-center gap-3 px-6 py-16 text-center"><Bell className="h-9 w-9 text-sepia"/><h2 className="text-xl">You're all caught up</h2><p className="text-sm text-muted-foreground">New follows, likes and comments will appear here.</p></div>}
    <div className="mt-5 border-t border-border">{notices.data?.map(n=>{
      const target=notificationTarget(n);
      const name=n.actor?.display_name||n.actor?.username||"LeBeHo";
      const message=n.kind==='moderation'?n.message:`${name} ${n.kind==='follow'?'started following you':n.kind==='like'?'liked your post':'commented on your post'}.`;
      const content=<><Avatar name={name} url={n.actor?.avatar_url} size={40}/><div className="min-w-0 flex-1"><p className="break-words text-sm">{message}</p><p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.created_at)}</p></div>{!n.is_read&&<span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread"/>}</>;
      const cls=`flex items-center gap-3 border-b border-border px-4 py-4 ${n.is_read?'':'bg-secondary/50'}`;
      return target?.type==='post'?<Link className={cls} key={n.id} to="/p/$id" params={{id:target.id}} onClick={()=>read(n.id)}>{content}</Link>:target?.type==='profile'?<Link className={cls} key={n.id} to="/u/$username" params={{username:target.username}} onClick={()=>read(n.id)}>{content}</Link>:<div key={n.id} className={cls}>{content}<Button variant="ghost" size="icon" aria-label="Mark as read" onClick={()=>read(n.id)}><CheckCheck/></Button></div>;
    })}</div>
  </div>;
}