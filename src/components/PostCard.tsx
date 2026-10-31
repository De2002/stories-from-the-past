import { Link } from "@tanstack/react-router";
import { Avatar, PostImage } from "./PostImage";
import { PostActions } from "./PostActions";
import { timeAgo, type Post } from "@/lib/api";

export function PostCard({ post, eager }: { post: Post; eager?: boolean }) {
  const p = post.profiles;
  return (
    <article className="border-b border-border pb-6">
      <header className="flex items-center gap-3 px-4 py-3">
        {p && (
          <Link to="/u/$username" params={{ username: p.username }} className="flex items-center gap-3">
            <Avatar name={p.display_name || p.username} url={p.avatar_url} />
            <div className="leading-tight">
              <div className="text-sm font-semibold">{p.username}</div>
              {post.location && <div className="text-xs text-muted-foreground">{post.location}</div>}
            </div>
          </Link>
        )}
        <span className="label-tag ml-auto text-muted-foreground">{timeAgo(post.created_at)}</span>
      </header>
      <Link to="/p/$id" params={{ id: post.id }} className="block px-3">
        <div className="print-frame">
          <PostImage src={post.image_url} alt={post.title} eager={eager} className="aspect-[4/5] w-full object-cover" />
        </div>
      </Link>
      <div className="space-y-2 px-4 pt-3">
        <PostActions post={post} />
        <div className="flex items-baseline gap-2">
          {post.era && <span className="label-tag text-primary">{post.era}</span>}
          <span className="label-tag text-muted-foreground">· {post.category}</span>
        </div>
        <Link to="/p/$id" params={{ id: post.id }} className="block">
          <h2 className="text-xl leading-snug">{post.title}</h2>
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{post.story}</p>
          <span className="mt-1 inline-block text-sm text-primary">Read the backstory</span>
        </Link>
      </div>
    </article>
  );
}
