import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { CONTACT_EMAIL, InfoPage, infoHead } from "@/components/InfoPage";

export const Route = createFileRoute("/contact")({
  head: () => infoHead("Contact us", `Reach the LeBeHo team by email at ${CONTACT_EMAIL}.`),
  component: () => (
    <InfoPage title="Contact us" intro="We're reachable by email only.">
      <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground">
        <Mail className="h-5 w-5" /> {CONTACT_EMAIL}
      </a>
      <p>Write to us for questions, feedback, account or data requests, copyright concerns, or press. We usually reply within a few days.</p>
    </InfoPage>
  ),
});
