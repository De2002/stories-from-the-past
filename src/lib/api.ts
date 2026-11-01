import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
};
export type Post = {
  id: string;
  user_id: string;
  image_url: string;
  title: string;
  story: string;
  era: string;
  location: string;
  category: string;
  created_at: string;
  is_hidden: boolean;
  profiles: Profile | null;
  likes: { user_id: string }[];
  comments: { count: number }[];
};

export const CATEGORIES = ["Objects", "People", "Technology", "Photography", "Music", "Household", "Places", "Fashion", "Documents"];

const POST_SELECT = "*, profiles!posts_user_id_fkey(*), likes(user_id), comments(count)";

export async function fetchPosts(opts: { userIds?: string[] | undefined; userId?: string | undefined; category?: string | undefined } = {}) {
  let q = supabase.from("posts").select(POST_SELECT).eq("is_hidden", false).order("created_at", { ascending: false }).limit(60);
  if (opts.userIds) q = q.in("user_id", opts.userIds.length ? opts.userIds : ["00000000-0000-0000-0000-000000000000"]);
  if (opts.userId) q = q.eq("user_id", opts.userId);
  if (opts.category) q = q.eq("category", opts.category);
  const { data, error } = await q;
  if (error) throw error;
  return data as unknown as Post[];
}

export async function fetchPost(id: string) {
  const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as Post | null;
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles!comments_user_id_fkey(*)")
    .eq("post_id", postId)
    .order("created_at");
  if (error) throw error;
  return data as unknown as { id: string; body: string; created_at: string; user_id: string; profiles: Profile }[];
}

export async function fetchFollowingIds(userId: string) {
  const { data } = await supabase.from("follows").select("following_id").eq("follower_id", userId);
  return (data ?? []).map((r) => r.following_id);
}

export async function fetchSavedIds(userId: string) {
  const { data } = await supabase.from("saves").select("post_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.post_id);
}

export async function fetchSavedPosts(userId: string) {
  const ids = await fetchSavedIds(userId);
  if (!ids.length) return [];
  const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("is_hidden", false).in("id", ids);
  if (error) throw error;
  return data as unknown as Post[];
}

export async function fetchProfile(username: string) {
  const { data } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
  if (!data) return null;
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", data.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", data.id),
  ]);
  return { ...(data as Profile), followers: followers ?? 0, following: following ?? 0 };
}

export async function fetchSuggested(excludeId?: string) {
  const { data } = await supabase.from("profiles").select("*").limit(8);
  return ((data ?? []) as Profile[]).filter((p) => p.id !== excludeId);
}

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}
