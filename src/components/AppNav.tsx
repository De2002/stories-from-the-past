import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, Compass, PlusSquare, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myProfile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
}

export function TopBar() {
  const { user, ready } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center px-4">
        <Link to="/" className="font-display text-2xl italic tracking-tight">
          LeBeHo
        </Link>
        <span className="label-tag ml-2 mt-1 text-muted-foreground">est. long ago</span>
        {ready && !user && (
          <Link to="/auth" className="ml-auto rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

export function BottomNav() {
  const { user } = useAuth();
  const me = useMyProfile();
  const cls = "flex flex-1 flex-col items-center gap-0.5 py-2 text-muted-foreground [&.active]:text-foreground";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-xl">
        <Link to="/" className={cls} activeOptions={{ exact: true }}>
          <Compass className="h-6 w-6" strokeWidth={1.6} />
          <span className="label-tag">Feed</span>
        </Link>
        <Link to="/new" className={cls}>
          <PlusSquare className="h-6 w-6" strokeWidth={1.6} />
          <span className="label-tag">Post</span>
        </Link>
        <Link to="/collection" className={cls}>
          <Bookmark className="h-6 w-6" strokeWidth={1.6} />
          <span className="label-tag">Collection</span>
        </Link>
        {user && me.data ? (
          <Link to="/u/$username" params={{ username: me.data.username }} className={cls}>
            <User className="h-6 w-6" strokeWidth={1.6} />
            <span className="label-tag">Me</span>
          </Link>
        ) : (
          <Link to="/auth" className={cls}>
            <User className="h-6 w-6" strokeWidth={1.6} />
            <span className="label-tag">Me</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
