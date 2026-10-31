import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, PostImage } from "@/components/PostImage";
import { PostActions } from "@/components/PostActions";
import { FollowButton } from "@/components/FollowButton";
import { fetchComments, fetchPost, timeAgo } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/p/$id")({
  head: () => ({
    meta: [
      { title: "A story on LeBeHo" },
      { name: "description", content: "An old thing and the story behind it, shared on LeBeHo." },
      { property: "og:title", content: "A story on LeBeHo" },
      { property: "og:description", content: "An old thing and the story behind it, shared on LeBeHo." },
    ],
  }),
  component: PostPage,
});

function PostPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const post = useQuery({ queryKey: ["post", id], queryFn: () => fetchPost(id) });
  const comments = useQuery({ queryKey: ["comments", id], queryFn: () => fetchComments(id) });
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  if (post.isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!post.data) return <div className="p-8 text-center">This post has gone missing.</div>;
  const p = post.data;
  const author = p.profiles;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("comments").insert({ post_id: id, user_id: user.id, body: body.trim() });
    setBusy(false);
    if (error) { toast.error("Couldn't post comment"); return; }
    setBody("");
    qc.invalidateQueries({ queryKey: ["comments", id] });
    qc.invalidateQueries({ queryKey: ["post", id] });
  };

  return (
    <article>
      <div className="px-3 pt-4">
        <div className="print-frame">
          <PostImage src={p.image_url} alt={p.title} eager className="w-full object-cover" />
        </div>
      </div>
      <div className="space-y-4 px-4 pt-4">
        <PostActions post={p} />
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {p.era && <span className="label-tag text-primary">{p.era}</span>}
          {p.location && <span className="label-tag text-muted-foreground">{p.location}</span>}
          <span className="label-tag text-muted-foreground">{p.category}</span>
        </div>
        <h1 className="text-3xl leading-tight">{p.title}</h1>
        {author && (
          <div className="flex items-center gap-3">
            <Link to="/u/$username" params={{ username: author.username }} className="flex items-center gap-2">
              <Avatar name={author.display_name || author.username} url={author.avatar_url} />
              <span className="text-sm font-semibold">{author.username}</span>
            </Link>
            <span className="text-xs text-muted-foreground">{timeAgo(p.created_at)}</span>
            <div className="ml-auto">
              <FollowButton targetId={author.id} />
            </div>
          </div>
        )}
        <div className="border-l-2 border-sepia pl-4">
          <div className="label-tag mb-2 text-muted-foreground">The backstory</div>
          <p className="whitespace-pre-line font-display text-lg leading-relaxed">{p.story}</p>
        </div>

        <section className="border-t border-border pt-4">
          <h2 className="label-tag mb-3 text-muted-foreground">Comments</h2>
          <ul className="space-y-4">
            {comments.data?.map((c) => (
              <li key={c.id} className="flex gap-3">
                <Avatar name={c.profiles?.username ?? "?"} url={c.profiles?.avatar_url} size={28} />
                <div className="text-sm">
                  <Link to="/u/$username" params={{ username: c.profiles?.username ?? "" }} className="font-semibold">
                    {c.profiles?.username}
                  </Link>{" "}
                  {c.body}
                  <div className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</div>
                </div>
              </li>
            ))}
            {comments.data?.length === 0 && <li className="text-sm text-muted-foreground">No comments yet. Know something about this?</li>}
          </ul>
          {user ? (
            <form onSubmit={submit} className="mt-4 flex gap-2">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={1000}
                placeholder="Add a memory or a fact…"
                className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <button disabled={busy || !body.trim()} className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
                Post
              </button>
            </form>
          ) : (
            <Link to="/auth" className="mt-4 block text-sm text-primary">Sign in to comment</Link>
          )}
        </section>
      </div>
    </article>
  );
}
