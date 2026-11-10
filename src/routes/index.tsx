import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PostCard } from "@/components/PostCard";
import { Avatar } from "@/components/PostImage";
import { CategoryRail, OldestRail } from "@/components/FeedSidebars";
import { LogoLoader } from "@/components/Brand";
import {
  CATEGORIES,
  fetchArchiveStats,
  fetchFollowingIds,
  fetchOldestPosts,
  fetchPosts,
  fetchSuggested,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeBeHo — Discover old things and their stories" },
      {
        name: "description",
        content:
          "Scroll vintage objects, forgotten places and old technology shared by collectors worldwide.",
      },
      { property: "og:title", content: "LeBeHo — Discover old things and their stories" },
      {
        property: "og:description",
        content:
          "Scroll vintage objects, forgotten places and old technology shared by collectors worldwide.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    queryFn: () =>
      fetchPosts({ category: cat, userIds: showFollowing ? (following.data ?? []) : undefined }),
    enabled: !showFollowing || !!following.data,
  });
  const suggested = useQuery({
    queryKey: ["suggested", user?.id],
    queryFn: () => fetchSuggested(user?.id),
  });
  const oldest = useQuery({ queryKey: ["oldestPosts"], queryFn: () => fetchOldestPosts() });
  const stats = useQuery({ queryKey: ["archiveStats"], queryFn: fetchArchiveStats });

  return (
    <div>
      <div className="mx-auto md:max-w-[680px]">
      <div className="hidden border-b border-border px-4 py-3 lg:block">
        <p className="label-tag text-muted-foreground">A living archive of ordinary treasures</p>
      </div>
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
          <Link
            key={p.id}
            to="/u/$username"
            params={{ username: p.username }}
            className="flex w-16 shrink-0 flex-col items-center gap-1"
          >
            <div className="rounded-full p-0.5 ring-2 ring-sepia">
              <Avatar name={p.display_name || p.username} url={p.avatar_url} size={56} />
            </div>
            <span className="w-full truncate text-center text-xs">{p.username}</span>
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden [scrollbar-width:none]">
        {[undefined, ...CATEGORIES].map((category) => (
          <button
            key={category ?? "all"}
            onClick={() => setCat(category)}
            className={`label-tag shrink-0 rounded-full border px-3 py-1.5 ${cat === category ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}
          >
            {category ?? "All eras"}
          </button>
        ))}
      </div>
      </div>

      <div className="mx-auto grid max-w-[1500px] grid-cols-[minmax(0,1fr)] gap-8 pb-12 md:grid-cols-[160px_minmax(0,1fr)_160px] md:gap-6 md:px-6 lg:grid-cols-[190px_minmax(0,680px)_190px] lg:justify-center lg:gap-10 lg:px-8 xl:grid-cols-[240px_680px_240px] xl:gap-16">
        <div className="hidden md:sticky md:top-24 md:block md:self-start">
          <CategoryRail activeCategory={cat} onSelect={setCat} stats={stats.data} />
        </div>
        <main className="min-w-0">
          {posts.isLoading && <LogoLoader label="Dusting off the archive" />}
          {posts.data?.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">
              {showFollowing
                ? "Follow a few collectors to fill this feed."
                : "Nothing here yet — be the first to post."}
            </div>
          )}
          {posts.data?.map((p, i) => (
            <PostCard key={p.id} post={p} eager={i === 0} />
          ))}
        </main>
        <div className="hidden md:block">{oldest.data && <OldestRail posts={oldest.data} />}</div>
      </div>
    </div>
  );
}
