import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchSavedIds, type Post } from "@/lib/api";

export function PostActions({ post }: { post: Post }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const initiallyLiked = !!user && post.likes.some((l) => l.user_id === user.id);
  const [liked, setLiked] = useState<boolean | null>(null);
  const isLiked = liked ?? initiallyLiked;
  const likeCount = post.likes.length - (initiallyLiked ? 1 : 0) + (isLiked ? 1 : 0);

  const saved = useQuery({
    queryKey: ["savedIds", user?.id],
    queryFn: () => fetchSavedIds(user!.id),
    enabled: !!user,
  });
  const isSaved = saved.data?.includes(post.id) ?? false;

  const requireAuth = () => {
    if (!user) navigate({ to: "/auth" });
    return !!user;
  };

  const toggleLike = async () => {
    if (!requireAuth()) return;
    const next = !isLiked;
    setLiked(next);
    const res = next
      ? await supabase.from("likes").insert({ user_id: user!.id, post_id: post.id })
      : await supabase.from("likes").delete().eq("user_id", user!.id).eq("post_id", post.id);
    if (res.error) setLiked(!next);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      if (isSaved) await supabase.from("saves").delete().eq("user_id", user!.id).eq("post_id", post.id);
      else await supabase.from("saves").insert({ user_id: user!.id, post_id: post.id });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["savedIds"] });
      qc.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });

  return (
    <div className="flex items-center gap-4">
      <button onClick={toggleLike} aria-label={isLiked ? "Unlike" : "Like"} className="flex items-center gap-1.5 transition-transform active:scale-90">
        <Heart className={`h-6 w-6 ${isLiked ? "fill-primary text-primary" : ""}`} strokeWidth={1.6} />
        <span className="text-sm tabular-nums">{likeCount}</span>
      </button>
      <Link to="/p/$id" params={{ id: post.id }} aria-label="Comments" className="flex items-center gap-1.5">
        <MessageCircle className="h-6 w-6" strokeWidth={1.6} />
        <span className="text-sm tabular-nums">{post.comments[0]?.count ?? 0}</span>
      </Link>
      <button
        onClick={() => requireAuth() && saveMut.mutate()}
        aria-label={isSaved ? "Remove from collection" : "Add to collection"}
        className="ml-auto"
      >
        <Bookmark className={`h-6 w-6 ${isSaved ? "fill-foreground" : ""}`} strokeWidth={1.6} />
      </button>
    </div>
  );
}
