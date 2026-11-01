import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_REASONS } from "@/lib/community";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function ReportPost({ postId }: { postId: string }) {
  const { user }=useAuth();
  const [open,setOpen]=useState(false);
  const [reason,setReason]=useState("Spam");
  const [details,setDetails]=useState("");
  const [busy,setBusy]=useState(false);
  const submit=async()=>{
    if(!user)return;
    setBusy(true);
    const {error}=await supabase.from("reports").insert({post_id:postId,reporter_id:user.id,reason,details:details.trim()});
    setBusy(false);
    if(error){toast.error(error.code==='23505'?"You've already reported this post":"Couldn't send report");return;}
    setOpen(false); setDetails(""); toast.success("Report sent for admin review");
  };
  return <><Button variant="ghost" size="sm" onClick={()=>setOpen(true)}><Flag/>Report</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Report this post</DialogTitle></DialogHeader>{user?<><label className="text-sm">Reason<select aria-label="Report reason" className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2" value={reason} onChange={e=>setReason(e.target.value)}>{REPORT_REASONS.map(r=><option key={r}>{r}</option>)}</select></label><Textarea aria-label="Report details" placeholder="Additional details (optional)" maxLength={2000} value={details} onChange={e=>setDetails(e.target.value)}/><DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={busy} onClick={submit}>{busy?'Sending…':'Send report'}</Button></DialogFooter></>:<Button asChild><Link to="/auth" onClick={()=>setOpen(false)}>Sign in to report</Link></Button>}</DialogContent></Dialog></>;
}