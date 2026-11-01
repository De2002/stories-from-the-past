import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ShieldCheck, Search, EyeOff, Eye, UserRoundX, UserRoundCheck, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getAdminData, moderate } from "@/lib/admin.functions";
import { useAdminAccess } from "@/lib/activity";
import { Avatar, PostImage } from "@/components/PostImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { timeAgo } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin dashboard — LeBeHo" }, { name: "description", content: "Manage the LeBeHo community, reports and content." },
    { property: "og:title", content: "Admin dashboard — LeBeHo" }, { property: "og:description", content: "Manage the LeBeHo community, reports and content." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: AdminPage,
});

type Action = "hide" | "restore" | "suspend" | "reinstate" | "resolve" | "dismiss" | "delete-comment";
function AdminPage() {
  const access = useAdminAccess();
  const fetchData = useServerFn(getAdminData);
  const act = useServerFn(moderate);
  const qc = useQueryClient();
  const records = useQuery({ queryKey: ["adminData"], queryFn: () => fetchData(), enabled: access.data === true });
  const [tab, setTab] = useState("Reports");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("open");
  const [pending, setPending] = useState<{ action: Action; id: string; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const request = (action: Action, id: string, label: string) => { setReason(""); setPending({ action, id, label }); };
  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try { await act({ data: { action: pending.action, id: pending.id, reason } }); setPending(null); await qc.invalidateQueries(); toast.success("Moderation action saved"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't save action"); }
    finally { setBusy(false); }
  };
  if (access.isLoading) return <p className="p-8 text-muted-foreground">Checking access…</p>;
  if (!access.data) return <div className="p-8"><h1 className="text-3xl">Admin access required</h1><Button asChild variant="link"><Link to="/">Back to feed</Link></Button></div>;
  const d = records.data;
  const matches = (text: string) => text.toLowerCase().includes(search.toLowerCase());
  return <div className="px-4 py-6">
    <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-primary" /><h1 className="text-3xl">Community desk</h1></div>
    <div className="my-5 grid grid-cols-3 divide-x border-y border-border py-4 text-center">
      {[[d?.users.length ?? 0,"Members"],[d?.reports.filter(r=>r.status==='open').length ?? 0,"Open reports"],[d?.posts.filter(p=>p.is_hidden).length ?? 0,"Hidden posts"]].map(([n,label])=><div key={label}><div className="font-display text-2xl">{n}</div><div className="text-xs text-muted-foreground">{label}</div></div>)}
    </div>
    <div className="flex overflow-x-auto border-b border-border" role="tablist">{["Reports","Users","Posts","Comments","History"].map(t=><Button key={t} role="tab" aria-selected={tab===t} variant="ghost" onClick={()=>setTab(t)} className={`shrink-0 rounded-none px-3 ${tab===t ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t}</Button>)}</div>
    <div className="relative my-4"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search records" placeholder={`Search ${tab.toLowerCase()}`} value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
    {records.isLoading && <p>Loading community records…</p>}
    {records.isError && <div><p>Couldn't load records.</p><Button variant="outline" onClick={()=>records.refetch()}>Try again</Button></div>}
    {tab==="Reports" && <><select aria-label="Report status" className="mb-4 rounded-md border border-input bg-background px-3 py-2 text-sm" value={filter} onChange={e=>setFilter(e.target.value)}><option value="open">Open reports</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="all">All reports</option></select>
      {d?.reports.filter(r=>(filter==='all'||r.status===filter)&&matches(`${r.reason} ${r.details} ${r.profiles?.username}`)).map(r=>{
        const p=d.posts.find(p=>p.id===r.post_id);
        return <div key={r.id} className="border-b border-border py-4"><div className="flex gap-3">{p&&<PostImage src={p.image_url} alt={p.title} className="h-20 w-20 shrink-0 rounded-md object-cover" />}<div className="min-w-0"><h2 className="text-lg">{r.reason}</h2><p className="text-sm">{p?.title??"Post unavailable"}</p><p className="text-xs text-muted-foreground">@{r.profiles?.username} · {timeAgo(r.created_at)} · {r.status}</p></div></div>{r.details&&<p className="mt-2 whitespace-pre-line break-words text-sm">{r.details}</p>}<div className="mt-3 flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link to="/p/$id" params={{id:r.post_id}}>Review post</Link></Button>{p&&<Button size="sm" variant="outline" onClick={()=>request(p.is_hidden?'restore':'hide',p.id,p.title)}>{p.is_hidden?<Eye/>:<EyeOff/>}{p.is_hidden?'Restore':'Hide'}</Button>}{r.status==='open'&&<><Button size="sm" variant="outline" onClick={()=>request('resolve',r.id,r.reason)}><Check/>Resolve</Button><Button size="sm" variant="ghost" onClick={()=>request('dismiss',r.id,r.reason)}><X/>Dismiss</Button></>}</div></div>;
      })}
      {d&&!d.reports.some(r=>(filter==='all'||r.status===filter)&&matches(`${r.reason} ${r.details} ${r.profiles?.username}`))&&<p className="py-10 text-center text-muted-foreground">No matching reports.</p>}</>}
    {tab==="Users"&&d?.users.filter(u=>matches(`${u.username} ${u.display_name}`)).map(u=>{const suspended=d.states.find(s=>s.user_id===u.id)?.suspended;return <div key={u.id} className="flex flex-wrap items-center gap-3 border-b border-border py-4"><Avatar name={u.username} url={u.avatar_url} size={40}/><div className="min-w-0 flex-1"><Link to="/u/$username" params={{username:u.username}} className="text-sm font-semibold">@{u.username}</Link><p className="text-xs text-muted-foreground">{suspended?'Suspended':'Active'} · Joined {new Date(u.created_at).toLocaleDateString()}</p></div><Button size="sm" variant="outline" onClick={()=>request(suspended?'reinstate':'suspend',u.id,`@${u.username}`)}>{suspended?<UserRoundCheck/>:<UserRoundX/>}{suspended?'Reinstate':'Suspend'}</Button></div>;})}
    {tab==="Posts"&&d?.posts.filter(p=>matches(`${p.title} ${p.profiles?.username}`)).map(p=><div key={p.id} className="flex items-center gap-3 border-b border-border py-4"><PostImage src={p.image_url} alt={p.title} className="h-16 w-16 shrink-0 rounded-md object-cover"/><div className="min-w-0 flex-1"><Link to="/p/$id" params={{id:p.id}} className="break-words font-display">{p.title}</Link><p className="text-xs text-muted-foreground">@{p.profiles?.username} · {p.is_hidden?'Hidden':'Visible'}</p></div><Button size="icon" variant="outline" title={p.is_hidden?'Restore post':'Hide post'} aria-label={p.is_hidden?'Restore post':'Hide post'} onClick={()=>request(p.is_hidden?'restore':'hide',p.id,p.title)}>{p.is_hidden?<Eye/>:<EyeOff/>}</Button></div>)}
    {tab==="Comments"&&d?.comments.filter(c=>matches(`${c.body} ${c.profiles?.username}`)).map(c=><div key={c.id} className="flex gap-3 border-b border-border py-4"><div className="min-w-0 flex-1"><p className="whitespace-pre-line break-words text-sm">{c.body}</p><Link to="/p/$id" params={{id:c.post_id}} className="text-xs text-primary">@{c.profiles?.username} · View post</Link></div><Button size="icon" variant="outline" title="Remove comment" aria-label="Remove comment" onClick={()=>request('delete-comment',c.id,c.body)}><Trash2/></Button></div>)}
    {tab==="History"&&d?.history.filter(h=>matches(`${h.action} ${h.reason}`)).map(h=><div key={h.id} className="border-b border-border py-4"><p className="text-sm font-semibold">{h.action} · {timeAgo(h.created_at)}</p><p className="break-words text-sm text-muted-foreground">{h.reason}</p></div>)}
    <Dialog open={!!pending} onOpenChange={open=>{if(!open&&!busy)setPending(null);}}><DialogContent><DialogHeader><DialogTitle>Confirm {pending?.action}</DialogTitle></DialogHeader><p className="break-words text-sm text-muted-foreground">{pending?.label}</p><Textarea aria-label="Moderation reason" placeholder="Reason for this action" value={reason} onChange={e=>setReason(e.target.value)} maxLength={1000}/><DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setPending(null)}>Cancel</Button><Button disabled={busy||reason.trim().length<3} onClick={confirm}>{busy?'Saving…':'Confirm action'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}