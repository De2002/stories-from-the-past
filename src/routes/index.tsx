import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/PostImage";
import { CATEGORIES, fetchFollowingIds, fetchPosts, fetchSuggested } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeBeHo — Discover old things and their stories" },
      { name: "description", content: "Scroll vintage objects, forgotten places and old technology shared by collectors worldwide." },
      { property: "og:title", content: "LeBeHo — Discover old things and their stories" },
      { property: "og:description", content: "Scroll vintage objects, forgotten places and old technology shared by collectors worldwide." },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"discover" | "following">("discover");
  const [cat, setCat] = useState<string | undefined>();

  const following = useQuery({
    queryKey: ["followingIds", user?.id],
    queryFn: () => fetchFollowingIds(user!.id),
    enabled: !!user,
  });
  const showFollowing = tab === "following" && !!user;
  const posts = useQuery({
    queryKey: ["posts", tab, cat, following.data],
    queryFn: () => fetchPosts({ category: cat, userIds: showFollowing ? following.data ?? [] : undefined }),
    enabled: !showFollowing || !!following.data,
  });
  const suggested = useQuery({ queryKey: ["suggested", user?.id], queryFn: () => fetchSuggested(user?.id) });

  return (
    <div>
      {user && (
        <div className="flex border-b border-border">
          {(["discover", "following"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`label-tag flex-1 py-3 ${tab === t ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto px-4 py-4 [scrollbar-width:none]">
        {suggested.data?.map((p) => (
          <Link key={p.id} to="/u/$username" params={{ username: p.username }} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <div className="rounded-full p-0.5 ring-2 ring-sepia">
              <Avatar name={p.display_name || p.username} url={p.avatar_url} size={56} />
            </div>
            <span className="w-full truncate text-center text-xs">{p.username}</span>
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        {[undefined, ...CATEGORIES].map((c) => (
          <button
            key={c ?? "all"}
            onClick={() => setCat(c)}
            className={`label-tag shrink-0 rounded-full border px-3 py-1.5 ${cat === c ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}
          >
            {c ?? "All eras"}
          </button>
        ))}
      </div>

      {posts.isLoading && <div className="p-8 text-center text-muted-foreground">Dusting off the archive…</div>}
      {posts.data?.length === 0 && (
        <div className="p-10 text-center text-muted-foreground">
          {showFollowing ? "Follow a few collectors to fill this feed." : "Nothing here yet — be the first to post."}
        </div>
      )}
      {posts.data?.map((p, i) => <PostCard key={p.id} post={p} eager={i === 0} />)}
    </div>
  );
}
