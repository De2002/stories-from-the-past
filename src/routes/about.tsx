import { createFileRoute } from "@tanstack/react-router";
import { InfoPage, infoHead } from "@/components/InfoPage";

export const Route = createFileRoute("/about")({
  head: () => infoHead("About", "LeBeHo is a worldwide social network for old things, old photographs and the stories behind them."),
  component: () => (
    <InfoPage title="About LeBeHo" intro="A place where the past gets a spot in everyone's feed.">
      <p>LeBeHo is a photograph-first social network for vintage objects, historical photographs, forgotten places, old technology and the people of years gone by.</p>
      <p>Every post is more than a picture. Members share the history, significance or personal memory behind what you're seeing — so a quick scroll turns into a journey through other people's pasts.</p>
      <h2>What you can do</h2>
      <ul>
        <li>Discover posts from collectors and history lovers worldwide</li>
        <li>Follow people whose finds you love</li>
        <li>Like, comment and save posts to your collection</li>
        <li>Share your own old things and the stories behind them</li>
      </ul>
    </InfoPage>
  ),
});
