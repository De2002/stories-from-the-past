export function canAdminister(roles: string[]) {
  return roles.includes("admin");
}

export function notificationTarget(notification: { post_id: string | null; actor: { username: string } | null }) {
  if (notification.post_id) return { type: "post" as const, id: notification.post_id };
  if (notification.actor?.username) return { type: "profile" as const, username: notification.actor.username };
  return null;
}

export const REPORT_REASONS = ["Spam", "Harassment", "Inappropriate content", "Misleading history", "Other"];