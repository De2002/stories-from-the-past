import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/InfoPage";

export const Route = createFileRoute("/guidelines")({
  head: () => infoHead("Community Guidelines", "How to share old things, photographs and stories respectfully on LeBeHo."),
  component: () => (
    <InfoPage title="Community Guidelines" intro="Help keep LeBeHo a warm, trustworthy archive.">
      <h2>Share the past</h2>
      <p>Post images of old objects, historical photographs, places and people from the past. Tell us the story — what it is, where it's from, and why it matters.</p>
      <h2>Be accurate</h2>
      <p>Separate known history from family lore or guesses. If you're unsure of a date or maker, say so.</p>
      <h2>Respect people</h2>
      <ul>
        <li>Only post photos of people you have the right to share</li>
        <li>No harassment, hate, or mocking of anyone's heritage</li>
        <li>Handle images of tragedy and conflict with care and context</li>
      </ul>
      <h2>Keep it real</h2>
      <ul>
        <li>No spam, scams or misleading sales listings</li>
        <li>Credit photographers and archives when you know them</li>
        <li>Don't upload content you don't have rights to</li>
      </ul>
      <p>Posts that break these guidelines can be reported, hidden by moderators, and repeat offenders may be suspended.</p>
    </InfoPage>
  ),
});
