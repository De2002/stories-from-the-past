import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

export function useImageUrl(src: string, bucket = "post-images") {
  const direct = src.startsWith("/") || src.startsWith("http");
  const key = `${bucket}:${src}`;
  const [resolved, setResolved] = useState<{ key: string; url: string } | null>(null);
  const url = direct ? src : cache.get(key) ?? (resolved?.key === key ? resolved.url : null);
  useEffect(() => {
    if (!src || direct || cache.has(key)) return;
    let cancelled = false;
    supabase.storage
      .from(bucket)
      .createSignedUrl(src, 60 * 60 * 24)
      .then(({ data }) => {
        if (data?.signedUrl) {
          cache.set(key, data.signedUrl);
          if (!cancelled) setResolved({ key, url: data.signedUrl });
        }
      });
    return () => { cancelled = true; };
  }, [src, direct, bucket, key]);
  return url;
}

export function PostImage({ src, alt, className, eager }: { src: string; alt: string; className?: string | undefined; eager?: boolean | undefined }) {
  const url = useImageUrl(src);
  if (!url) return <div className={`animate-pulse bg-muted ${className ?? ""}`} />;
  return <img src={url} alt={alt} className={className} loading={eager ? "eager" : "lazy"} />;
}

export function Avatar({ name, url, size = 32, square }: { name: string; url?: string | null | undefined; size?: number; square?: boolean | undefined }) {
  const imageUrl = useImageUrl(url ?? "", "avatars");
  const shape = square ? "rounded-sm" : "rounded-full";
  if (imageUrl) return <img src={imageUrl} alt={name} width={size} height={size} className={`shrink-0 object-cover ${shape}`} style={{ width: size, height: size }} />;
  return (
    <div
      className={`flex items-center justify-center bg-sepia font-display text-primary-foreground ${shape}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
