import { describe, expect, it } from "vitest";
import { canAdminister, notificationTarget } from "@/lib/community";

describe("Community rules", () => {
  it("allows admin accounts to administer the community", () => { expect(canAdminister(["user", "admin"])).toBe(true); });
  it("denies ordinary and moderator accounts admin tools", () => { expect(canAdminister(["user", "moderator"])).toBe(false); });
  it("deep links post notifications to the specific post", () => { expect(notificationTarget({ post_id: "post-42", actor: { username: "collector" } })).toEqual({ type: "post", id: "post-42" }); });
  it("deep links follows to the actor profile", () => { expect(notificationTarget({ post_id: null, actor: { username: "collector" } })).toEqual({ type: "profile", username: "collector" }); });
});