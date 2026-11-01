import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Post } from "@/lib/api";

export const getOwnPosts = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("posts").select("*, profiles!posts_user_id_fkey(*), likes(user_id), comments(count)").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(60);
  if (error) throw new Error("Couldn't load your posts");
  return data as unknown as Post[];
});