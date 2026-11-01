import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServerFn } from "@tanstack/react-start";
import { getOwnPosts } from "@/lib/posts.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, PostImage } from "@/components/PostImage";
import { FollowButton } from "@/components/FollowButton";
import { fetchPosts, fetchProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} on LeBeHo` },
      { name: "description", content: `Old things and their stories shared by @${params.username}.` },
      { property: "og:title", content: `@${params.username} on LeBeHo` },
      { property: "og:description", content: `Old things and their stories shared by @${params.username}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchMine = useServerFn(getOwnPosts);
  const profile = useQuery({ queryKey: ["profile", username], queryFn: () => fetchProfile(username) });
  const posts = useQuery({
    queryKey: ["posts", "user", profile.data?.id, user?.id],
    queryFn: () => profile.data ? user?.id === profile.data.id ? fetchMine() : fetchPosts({ userId: profile.data.id }) : Promise.resolve([]),
    enabled: !!profile.data,
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!photo) { setPreview(null); return; }
    const objectUrl = URL.createObjectURL(photo);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  if (profile.isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!profile.data) return <div className="p-8 text-center">No collector by that name.</div>;
  const pr = profile.data;
  const isMe = user?.id === pr.id;

  const save = async () => {
    if (!user || user.id !== pr.id) return;
    setSaving(true);
    let uploaded: string | null = null;
    try {
      if (photo) {
        uploaded = `${user.id}/${crypto.randomUUID()}.${photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg'}`;
        const upload = await supabase.storage.from("avatars").upload(uploaded, photo, { contentType: photo.type });
        if (upload.error) throw new Error("Couldn't upload photo");
      }
      const { error } = await supabase.from("profiles").update({ display_name: name, bio, ...(uploaded ? { avatar_url: uploaded } : {}) }).eq("id", pr.id);
      if (error) throw new Error("Couldn't save profile");
      if (uploaded && pr.avatar_url && !pr.avatar_url.startsWith("http") && !pr.avatar_url.startsWith("/")) await supabase.storage.from("avatars").remove([pr.avatar_url]);
      setEditing(false); setPhoto(null); await qc.invalidateQueries(); toast.success("Profile updated");
    } catch (error) {
      if (uploaded) await supabase.storage.from("avatars").remove([uploaded]);
      toast.error(error instanceof Error ? error.message : "Couldn't save profile");
    } finally { setSaving(false); }
  };
  const signOut = async () => {
    await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true });
  };

  return (
    <div>
      <section className="px-4 py-6">
        <div className="flex items-center gap-5">
          {preview && editing ? <img src={preview} alt="New profile photo" className="h-20 w-20 shrink-0 rounded-full object-cover" /> : <Avatar name={pr.display_name || pr.username} url={pr.avatar_url} size={80} />}
          <div className="flex flex-1 justify-around text-center">
            <Stat n={posts.data?.length ?? 0} label="Posts" />
            <Stat n={pr.followers} label="Followers" />
            <Stat n={pr.following} label="Following" />
          </div>
        </div>
        {editing ? (
          <div className="mt-4 space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-primary"><Camera className="h-4 w-4" />Change profile photo<input aria-label="Profile photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={saving} onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { toast.error("Choose a JPG, PNG or WebP photo"); return; } if (file.size > 5*1024*1024) { toast.error("Photo must be under 5MB"); return; } setPhoto(file); }} /></label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What do you collect?" rows={3} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <Button disabled={saving} onClick={save}>{saving ? "Saving…" : "Save"}</Button>
              <Button variant="outline" disabled={saving} onClick={() => { setEditing(false); setPhoto(null); }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <h1 className="text-2xl">{pr.display_name || pr.username}</h1>
            <div className="text-sm text-muted-foreground">@{pr.username}</div>
            {pr.bio && <p className="mt-2 text-sm">{pr.bio}</p>}
            <div className="mt-4 flex gap-2">
              {isMe ? (
                <>
                  <Button variant="secondary" onClick={() => { setName(pr.display_name); setBio(pr.bio); setEditing(true); }}>Edit profile</Button>
                  <Button variant="outline" onClick={signOut}>Sign out</Button>
                </>
              ) : (
                <FollowButton targetId={pr.id} />
              )}
            </div>
          </div>
        )}
      </section>
      <div className="grid grid-cols-3 gap-0.5 border-t border-border pt-0.5">
        {posts.data?.map((p) => (
          <Link key={p.id} to="/p/$id" params={{ id: p.id }}>
            <PostImage src={p.image_url} alt={p.title} className="aspect-square w-full object-cover" />
          </Link>
        ))}
      </div>
      {posts.data?.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No posts yet.</p>}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <div className="font-display text-xl">{n}</div>
      <div className="label-tag text-muted-foreground">{label}</div>
    </div>
  );
}
