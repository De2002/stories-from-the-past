import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

export function useImageUrl(src: string) {
  const direct = src.startsWith("/") || src.startsWith("http");
  const [url, setUrl] = useState<string | null>(direct ? src : cache.get(src) ?? null);
  useEffect(() => {
    if (direct || cache.has(src)) return;
    supabase.storage
      .from("post-images")
      .createSignedUrl(src, 60 * 60 * 24)
      .then(({ data }) => {
        if (data?.signedUrl) {
          cache.set(src, data.signedUrl);
          setUrl(data.signedUrl);
        }
      });
  }, [src, direct]);
  return url;
}

export function PostImage({ src, alt, className, eager }: { src: string; alt: string; className?: string | undefined; eager?: boolean | undefined }) {
  const url = useImageUrl(src);
  if (!url) return <div className={`animate-pulse bg-muted ${className ?? ""}`} />;
  return <img src={url} alt={alt} className={className} loading={eager ? "eager" : "lazy"} />;
}

export function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  if (url) return <img src={url} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div
      className="flex items-center justify-center rounded-full bg-sepia font-display text-primary-foreground"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
