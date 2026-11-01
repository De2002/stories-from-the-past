import { createFileRoute } from "@tanstack/react-router";
import { CONTACT_EMAIL, InfoPage, infoHead } from "@/components/InfoPage";

export const Route = createFileRoute("/terms")({
  head: () => infoHead("Terms of Service", "The terms that apply when you use LeBeHo."),
  component: () => (
    <InfoPage title="Terms of Service" intro="By using LeBeHo you agree to these terms.">
      <h2>Your account</h2>
      <p>You're responsible for your account and what you post. Keep your sign-in details safe.</p>
      <h2>Your content</h2>
      <p>You keep ownership of what you share. By posting, you give LeBeHo permission to display and distribute it within the service. Only post content you have the right to share.</p>
      <h2>Acceptable use</h2>
      <p>Follow our Community Guidelines. We may remove content or suspend accounts that break them or these terms.</p>
      <h2>No warranty</h2>
      <p>LeBeHo is provided as is. Historical information shared by members isn't verified by us and shouldn't be relied on as professional appraisal or advice.</p>
      <h2>Changes</h2>
      <p>We may update these terms; continued use means you accept the updated version.</p>
      <h2>Contact</h2>
      <p>Questions? Email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
    </InfoPage>
  ),
});
