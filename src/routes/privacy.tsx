import { createFileRoute } from "@tanstack/react-router";
import { CONTACT_EMAIL, InfoPage, infoHead } from "@/components/InfoPage";

export const Route = createFileRoute("/privacy")({
  head: () => infoHead("Privacy Policy", "What information LeBeHo collects and how it is used."),
  component: () => (
    <InfoPage title="Privacy Policy" intro="We collect only what's needed to run LeBeHo.">
      <h2>What we collect</h2>
      <ul>
        <li>Account details: email address, username, display name, bio and profile photo</li>
        <li>Content you post: images, stories, comments</li>
        <li>Activity: likes, follows, saves, reports and notifications</li>
      </ul>
      <h2>How we use it</h2>
      <p>To operate the service, show your posts and profile, deliver notifications, and keep the community safe through moderation.</p>
      <h2>What's public</h2>
      <p>Your profile, posts and comments are visible to anyone. Your email, saved collection and notifications are private.</p>
      <h2>We don't sell your data</h2>
      <p>We never sell your personal information.</p>
      <h2>Your choices</h2>
      <p>You can edit your profile any time. To delete your account or data, email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </InfoPage>
  ),
});
