import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { canDeleteUser } from "@/lib/community";

export const getAdminData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (role.error || !role.data) throw new Error("Admin access required");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const [users, states, posts, reports, comments, history, roles] = await Promise.all([
      db.from("profiles").select("*").order("created_at", { ascending: false }).limit(500),
      db.from("account_moderation").select("*"),
      db.from("posts").select("*, profiles!posts_user_id_fkey(username)").order("created_at", { ascending: false }).limit(200),
      db.from("reports").select("*, profiles!reports_reporter_id_fkey(username)").order("created_at", { ascending: false }).limit(200),
      db.from("comments").select("*, profiles!comments_user_id_fkey(username)").order("created_at", { ascending: false }).limit(200),
      db.from("moderation_actions").select("*").order("created_at", { ascending: false }).limit(50),
      db.from("user_roles").select("user_id").eq("role", "admin"),
    ]);
    for (const result of [users, states, posts, reports, comments, history, roles]) if (result.error) throw new Error("Couldn't load admin records");
    return { users: users.data ?? [], states: states.data ?? [], posts: posts.data ?? [], reports: reports.data ?? [], comments: comments.data ?? [], history: history.data ?? [], adminIds: (roles.data ?? []).map(r => r.user_id) };
  });

export const moderate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ action: z.enum(["hide", "restore", "suspend", "reinstate", "resolve", "dismiss", "delete-comment", "delete-user"]), id: z.string().uuid(), reason: z.string().trim().min(3).max(1000), confirmation: z.string().optional() }))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (role.error || !role.data) throw new Error("Admin access required");
    if (data.action === "delete-user") {
      const targetRole = await context.supabase.rpc("has_role", { _user_id: data.id, _role: "admin" });
      if (targetRole.error || !canDeleteUser(context.userId, data.id, Boolean(targetRole.data))) throw new Error("Admin accounts cannot be deleted here");
      const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
      const profile = await db.from("profiles").select("username").eq("id", data.id).single();
      if (profile.error) throw new Error("User not found");
      if (data.confirmation !== profile.data.username) throw new Error("Type the exact username to confirm deletion");
      // Remove every uploaded file, including older unreferenced uploads. Never touch seed media.
      for (const bucket of ["post-images", "avatars"]) {
        while (true) {
          const files = await db.storage.from(bucket).list(data.id, { limit: 100 });
          if (files.error) throw new Error("Couldn't read user photos. Nothing has been deleted from the account yet.");
          if (!files.data.length) break;
          const removed = await db.storage.from(bucket).remove(files.data.map(file => `${data.id}/${file.name}`));
          if (removed.error) throw new Error("Couldn't remove user photos. Retry deletion to finish.");
        }
      }
      // Fictional seeded profiles have no sign-in account, but can still be removed.
      const authUser = await db.auth.admin.getUserById(data.id);
      if (authUser.error && authUser.error.status !== 404) throw new Error("Couldn't check the sign-in account");
      if (authUser.data.user) {
        const deleted = await db.auth.admin.deleteUser(data.id);
        if (deleted.error) throw new Error("Couldn't delete the sign-in account. Retry deletion to finish.");
      }
      const cleanup = await db.rpc("finish_user_deletion", { actor: context.userId, target: data.id, deletion_reason: data.reason });
      if (cleanup.error) throw new Error("Sign-in removed, but profile cleanup is incomplete. Retry deletion to finish.");
      return { success: true };
    }
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    let recipient: string | undefined;
    let postId: string | undefined;
    if (data.action === "suspend" || data.action === "reinstate") {
      const targetRole = await context.supabase.rpc("has_role", { _user_id: data.id, _role: "admin" });
      if (targetRole.error || targetRole.data || data.id === context.userId) throw new Error("Admin accounts cannot be suspended here");
      const result = await db.from("account_moderation").upsert({ user_id: data.id, suspended: data.action === "suspend", reason: data.reason, updated_at: new Date().toISOString() });
      if (result.error) throw new Error("Couldn't update account");
      recipient = data.id;
    } else if (data.action === "hide" || data.action === "restore") {
      const result = await db.from("posts").update({ is_hidden: data.action === "hide" }).eq("id", data.id).select("user_id").single();
      if (result.error) throw new Error("Couldn't update post");
      recipient = result.data.user_id; postId = data.id;
    } else if (data.action === "delete-comment") {
      const result = await db.from("comments").delete().eq("id", data.id).select("user_id,post_id").single();
      if (result.error) throw new Error("Couldn't remove comment");
      recipient = result.data.user_id; postId = result.data.post_id;
    } else {
      const result = await db.from("reports").update({ status: data.action === "resolve" ? "resolved" : "dismissed", reviewed_at: new Date().toISOString() }).eq("id", data.id).select("reporter_id,post_id").single();
      if (result.error) throw new Error("Couldn't review report");
      recipient = result.data.reporter_id; postId = result.data.post_id;
    }
    const log = await db.from("moderation_actions").insert({ admin_id: context.userId, action: data.action, target_id: data.id, reason: data.reason });
    if (log.error) throw new Error("Action completed, but history could not be saved");
    if (recipient) {
      const notice = await db.from("notifications").insert({ recipient_id: recipient, actor_id: context.userId, kind: "moderation", post_id: postId ?? null, message: `${data.action}: ${data.reason}` });
      if (notice.error) throw new Error("Action completed, but notification could not be sent");
    }
    return { success: true };
  });