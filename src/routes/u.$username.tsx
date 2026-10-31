import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const profile = useQuery({ queryKey: ["profile", username], queryFn: () => fetchProfile(username) });
  const posts = useQuery({
    queryKey: ["posts", "user", profile.data?.id],
    queryFn: () => fetchPosts({ userId: profile.data!.id }),
    enabled: !!profile.data,
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  if (profile.isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!profile.data) return <div className="p-8 text-center">No collector by that name.</div>;
  const pr = profile.data;
  const isMe = user?.id === pr.id;

  const save = async () => {
    const { error } = await supabase.from("profiles").update({ display_name: name, bio }).eq("id", pr.id);
    if (error) { toast.error("Couldn't save"); return; }
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["profile", username] });
  };

  return (
    <div>
      <section className="px-4 py-6">
        <div className="flex items-center gap-5">
          <Avatar name={pr.display_name || pr.username} url={pr.avatar_url} size={80} />
          <div className="flex flex-1 justify-around text-center">
            <Stat n={posts.data?.length ?? 0} label="Posts" />
            <Stat n={pr.followers} label="Followers" />
            <Stat n={pr.following} label="Following" />
          </div>
        </div>
        {editing ? (
          <div className="mt-4 space-y-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What do you collect?" rows={3} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={save} className="rounded-md bg-primary px-4 py-1.5 text-sm text-primary-foreground">Save</button>
              <button onClick={() => setEditing(false)} className="rounded-md border border-border px-4 py-1.5 text-sm">Cancel</button>
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
                  <button onClick={() => { setName(pr.display_name); setBio(pr.bio); setEditing(true); }} className="rounded-md border border-border bg-secondary px-4 py-1.5 text-sm">Edit profile</button>
                  <button onClick={() => supabase.auth.signOut()} className="rounded-md border border-border px-4 py-1.5 text-sm text-muted-foreground">Sign out</button>
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
