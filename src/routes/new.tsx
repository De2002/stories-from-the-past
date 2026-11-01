import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "Share an old thing — LeBeHo" },
      { name: "description", content: "Post a photograph of something old and tell its story." },
      { property: "og:title", content: "Share an old thing — LeBeHo" },
      { property: "og:description", content: "Post a photograph of something old and tell its story." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewPost,
});

const field = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function NewPost() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [f, setF] = useState({ title: "", story: "", era: "", location: "", category: "Objects" });
  const [busy, setBusy] = useState(false);

  if (ready && !user)
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Sign in to share your old things.</p>
        <Link to="/auth" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Sign in</Link>
      </div>
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) { toast.error("Add a photograph first"); return; }
    if (!f.title.trim() || !f.story.trim()) { toast.error("Give it a title and a backstory"); return; }
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("post-images").upload(path, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      { toast.error("Upload failed"); return; }
    }
    const { data, error } = await supabase
      .from("posts")
      .insert({ user_id: user.id, image_url: path, ...f, title: f.title.trim(), story: f.story.trim() })
      .select("id")
      .single();
    setBusy(false);
    if (error) { toast.error("Couldn't publish"); return; }
    navigate({ to: "/p/$id", params: { id: data.id } });
  };

  return (
    <form onSubmit={submit} className="space-y-4 px-4 py-6">
      <h1 className="text-3xl">Share an old thing</h1>
      <label className="print-frame flex aspect-[4/5] cursor-pointer items-center justify-center">
        {preview ? (
          <img src={preview} alt="Preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImagePlus className="h-10 w-10" strokeWidth={1.4} />
            <span className="text-sm">Choose a photograph</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
            setFile(file);
            setPreview(URL.createObjectURL(file));
          }}
        />
      </label>
      <input className={field} placeholder="What is it? e.g. Grandmother's Zenit camera" maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
      <textarea className={field} rows={6} placeholder="The backstory — history, significance, or your memory of it" maxLength={4000} value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} />
      <div className="grid grid-cols-2 gap-3">
        <input className={field} placeholder="Era (e.g. 1960s)" maxLength={40} value={f.era} onChange={(e) => setF({ ...f, era: e.target.value })} />
        <input className={field} placeholder="Place (e.g. Kampala)" maxLength={80} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
      </div>
      <select className={field} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground disabled:opacity-50">
        {busy ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}
