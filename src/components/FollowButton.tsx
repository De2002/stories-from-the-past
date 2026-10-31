import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchFollowingIds } from "@/lib/api";

export function FollowButton({ targetId }: { targetId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const following = useQuery({
    queryKey: ["followingIds", user?.id],
    queryFn: () => fetchFollowingIds(user!.id),
    enabled: !!user,
  });
  if (user?.id === targetId) return null;
  const isFollowing = following.data?.includes(targetId) ?? false;

  const toggle = async () => {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (isFollowing) await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
    else await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
    qc.invalidateQueries({ queryKey: ["followingIds"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <button
      onClick={toggle}
      className={`rounded-md px-4 py-1.5 text-sm font-medium ${isFollowing ? "border border-border bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
