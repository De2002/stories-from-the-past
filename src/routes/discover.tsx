import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Shuffle } from "lucide-react";
import { PostImage } from "@/components/PostImage";
import { LogoLoader } from "@/components/Brand";
import { fetchRandomPosts } from "@/lib/api";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover — LeBeHo" },
      { name: "description", content: "A wall of small photographs from the archive, shuffled at random: old objects, portraits, places and technology from everywhere." },
      { property: "og:title", content: "Discover — LeBeHo" },
      { property: "og:description", content: "A wall of small photographs from the archive, shuffled at random: old objects, portraits, places and technology from everywhere." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});

function Discover() {
  const [seed, setSeed] = useState(0);
  const posts = useQuery({
    queryKey: ["discover", seed],
    queryFn: () => fetchRandomPosts(),
  });

  return (
    <div>
      <div className="flex items-center gap-3 px-4 pb-2 pt-4">
        <h1 className="text-2xl italic">Discover</h1>
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="label-tag ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Shuffle className="h-3.5 w-3.5" /> Shuffle
        </button>
      </div>

      {posts.isLoading && <LogoLoader label="Shuffling the archive" />}
      {posts.data?.length === 0 && (
        <div className="p-10 text-center text-muted-foreground">Nothing to discover yet — be the first to post.</div>
      )}

      <div className="grid grid-cols-3 gap-2 px-3 pb-6 sm:grid-cols-4">
        {posts.data?.map((p, i) => (
          <Link
            key={p.id}
            to="/p/$id"
            params={{ id: p.id }}
            aria-label={p.title || "Open photograph"}
            className="print-frame-sm block"
          >
            <PostImage src={p.image_url} alt={p.title} eager={i < 12} className="aspect-square w-full object-cover" />
          </Link>
        ))}
      </div>
    </div>
  );
}
