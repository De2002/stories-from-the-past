import type { ReactNode } from "react";

export const CONTACT_EMAIL = "oldtimes@lebeho.com";

export function InfoPage({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <article className="px-5 py-8">
      <h1 className="font-display text-3xl">{title}</h1>
      {intro && <p className="mt-3 text-muted-foreground">{intro}</p>}
      <div className="mt-6 space-y-5 text-[15px] leading-relaxed [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-xl [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </article>
  );
}

export function infoHead(title: string, description: string) {
  const t = `${title} — LeBeHo`;
  return {
    meta: [
      { title: t },
      { name: "description", content: description },
      { property: "og:title", content: t },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
