import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Bookmark, Compass, Menu, PlusSquare, ShieldCheck, User } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { LOGO_URL } from "@/components/Brand";
import { useAdminAccess, useNotifications } from "@/lib/activity";
import { Button } from "@/components/ui/button";

export function useMyProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["myProfile", user?.id],
    enabled: !!user,
    queryFn: async () => user ? (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data : null,
  });
}

export function TopBar() {
  const { user, ready } = useAuth();
  const access = useAdminAccess();
  const notifications = useNotifications();
  const unread = notifications.data?.filter(n => !n.is_read).length ?? 0;
  const guest = ready && !user;
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-xl items-center px-4">
        {guest && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader><SheetTitle className="font-display">LeBeHo</SheetTitle></SheetHeader>
              <nav className="mt-4 flex flex-col">
                {([["/about", "About"], ["/guidelines", "Guidelines"], ["/terms", "Terms"], ["/privacy", "Privacy policy"], ["/contact", "Contact us"]] as const).map(([to, label]) => (
                  <SheetClose asChild key={to}>
                    <Link to={to} className="border-b border-border px-1 py-3 text-base">{label}</Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        )}
        <Link to="/" aria-label="LeBeHo home" className={guest ? "absolute left-1/2 -translate-x-1/2" : ""}>
          <img src={LOGO_URL} alt="LeBeHo" className="h-10 w-10 object-contain" />
        </Link>
        <div className="ml-auto flex items-center gap-1">
          {access.data && <Button asChild variant="ghost" size="icon"><Link to="/admin" aria-label="Admin dashboard" title="Admin dashboard"><ShieldCheck /></Link></Button>}
          {user && <Button asChild variant="ghost" size="icon"><Link to="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} title="Notifications" className="relative"><Bell />{unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unread > 99 ? "99+" : unread}</span>}</Link></Button>}
        {ready && !user && (
          <Link to="/auth" className="ml-auto rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
            Sign in
          </Link>
        )}
        </div>
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
