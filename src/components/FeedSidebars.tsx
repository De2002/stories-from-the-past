import { Link } from "@tanstack/react-router";
import { PostImage } from "@/components/PostImage";
import { CATEGORIES, type Post } from "@/lib/api";

export function CategoryRail({
  activeCategory,
  onSelect,
  stats,
}: {
  activeCategory?: string | undefined;
  onSelect: (category?: string) => void;
  stats?: { posts: number; users: number } | undefined;
}) {
  return (
    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
      <div>
        <p className="label-tag mb-3 text-muted-foreground">Browse the archive</p>
        <nav aria-label="Categories" className="space-y-1">
          <button
            onClick={() => onSelect()}
            className={`category-link ${!activeCategory ? "category-link-active" : ""}`}
          >
            <span>All eras</span>
            <span className="category-index">00</span>
          </button>
          {CATEGORIES.map((category, index) => (
            <button
              key={category}
              onClick={() => onSelect(category)}
              className={`category-link ${activeCategory === category ? "category-link-active" : ""}`}
            >
              <span>{category}</span>
              <span className="category-index">{String(index + 1).padStart(2, "0")}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-5 lg:grid-cols-1">
        <Stat label="pictures posted" value={stats ? stats.posts.toLocaleString() : "—"} />
        <Stat label="collectors" value={stats ? stats.users.toLocaleString() : "—"} />
      </div>
    </aside>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-3xl leading-none text-foreground">{value}</p>
      <p className="label-tag mt-2 text-muted-foreground">{label}</p>
    </div>
  );
}

export function OldestRail({ posts }: { posts: Post[] }) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-end justify-between pb-3">
        <div>
          <p className="label-tag text-muted-foreground">From the beginning</p>
          <h2 className="mt-1 font-display text-xl">The first frames</h2>
        </div>
        <span className="label-tag text-muted-foreground">01—06</span>
      </div>
      <div className="space-y-4">
        {posts.map((post, index) => (
          <Link key={post.id} to="/p/$id" params={{ id: post.id }} className="group block">
            <figure
              className="polaroid-card"
              style={{ transform: `rotate(${index % 2 === 0 ? -1 : 1.2}deg)` }}
            >
              <PostImage
                src={post.image_url}
                alt={post.title || "Archived photograph"}
                className="aspect-[5/4] w-full object-cover"
              />
              <figcaption className="mt-2 truncate font-hand text-lg text-foreground/80">
                {post.title || "Untitled frame"}
              </figcaption>
            </figure>
          </Link>
        ))}
      </div>
    </aside>
  );
}
