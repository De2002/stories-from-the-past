import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PostImage } from "@/components/PostImage";
import { fetchSavedPosts } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "Your collection — LeBeHo" },
      { name: "description", content: "The old things and stories you've saved on LeBeHo." },
      { property: "og:title", content: "Your collection — LeBeHo" },
      { property: "og:description", content: "The old things and stories you've saved on LeBeHo." },
    ],
  }),
  component: Collection,
});

function Collection() {
  const { user, ready } = useAuth();
  const saved = useQuery({ queryKey: ["savedPosts", user?.id], queryFn: () => fetchSavedPosts(user!.id), enabled: !!user });
  if (ready && !user)
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">Sign in to start your collection.</p>
        <Link to="/auth" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Sign in</Link>
      </div>
    );
  return (
    <div>
      <h1 className="px-4 py-5 text-3xl">Your collection</h1>
      {saved.data?.length === 0 && <p className="px-4 text-sm text-muted-foreground">Tap the bookmark on any post to keep it here.</p>}
      <div className="grid grid-cols-2 gap-3 px-3">
        {saved.data?.map((p) => (
          <Link key={p.id} to="/p/$id" params={{ id: p.id }} className="print-frame block">
            <PostImage src={p.image_url} alt={p.title} className="aspect-[4/5] w-full object-cover" />
            <div className="pt-2 font-display text-sm leading-tight">{p.title}</div>
            <div className="label-tag text-muted-foreground">{p.era}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
