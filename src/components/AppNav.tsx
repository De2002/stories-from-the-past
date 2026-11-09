import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, LayoutGrid, MessageCircle, Bookmark, Compass, Menu, MoreHorizontal, PlusSquare, ShieldCheck, User } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { LOGO_URL } from "@/components/Brand";
import { useAdminAccess, useNotifications } from "@/lib/activity";
import { useInbox } from "@/lib/messages";
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
  const inbox = useInbox();
  const dms = inbox.data?.reduce((n, c) => n + c.unread, 0) ?? 0;
  const guest = ready && !user;
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-xl items-center px-4 md:h-20 md:max-w-6xl md:gap-3 md:px-6">
        {guest && (
          <>
            <div className="md:hidden">
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
            </div>
          </>
        )}
        <Link to="/" aria-label="LeBeHo home" className={guest ? "absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:shrink-0" : "shrink-0"}>
          <img src={LOGO_URL} alt="LeBeHo" className="h-10 w-10 object-contain md:h-12 md:w-12" />
        </Link>
        <nav aria-label="Desktop navigation" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
          <NavigationEntries desktop />
          <MorePagesMenu />
        </nav>
        <div className="ml-auto flex items-center gap-1">
          {access.data && <Button asChild variant="ghost" size="icon"><Link to="/admin" aria-label="Admin dashboard" title="Admin dashboard"><ShieldCheck /></Link></Button>}
          {user && <Button asChild variant="ghost" size="icon"><Link to="/messages" aria-label={`Messages${dms ? `, ${dms} unread` : ""}`} title="Messages" className="relative"><MessageCircle />{dms > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{dms > 99 ? "99+" : dms}</span>}</Link></Button>}
          {user && <Button asChild variant="ghost" size="icon"><Link to="/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} title="Notifications" className="relative"><Bell />{unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unread > 99 ? "99+" : unread}</span>}</Link></Button>}
        {ready && !user && (
          <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
        )}
        </div>
      </div>
    </header>
  );
}

function MorePagesMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-3 text-muted-foreground [&[data-state=open]]:bg-accent [&[data-state=open]]:text-foreground" aria-label="More pages">
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {([["/about", "About"], ["/guidelines", "Guidelines"], ["/terms", "Terms"], ["/privacy", "Privacy policy"], ["/contact", "Contact us"]] as const).map(([to, label]) => (
          <DropdownMenuItem asChild key={to}>
            <Link to={to}>{label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavigationEntries({ desktop = false }: { desktop?: boolean }) {
  const { user } = useAuth();
  const me = useMyProfile();
  const cls = desktop
    ? "gap-2 text-muted-foreground [&.active]:bg-accent [&.active]:text-foreground"
    : "flex h-auto flex-1 flex-col items-center gap-0.5 rounded-none px-0 py-2 text-muted-foreground [&.active]:text-foreground";
  const iconClass = desktop ? "h-5 w-5" : "h-6 w-6";
  const labelClass = desktop ? "inline" : "label-tag";
  return (
    <>
        <Button asChild variant="ghost" className={cls}><Link to="/" aria-label="Feed" title="Feed" activeOptions={{ exact: true }}>
          <Compass className={iconClass} strokeWidth={1.6} />
          <span className={labelClass}>Feed</span>
        </Link></Button>
        <Button asChild variant="ghost" className={cls}><Link to="/discover" aria-label="Discover" title="Discover">
          <LayoutGrid className={iconClass} strokeWidth={1.6} />
          <span className={labelClass}>Discover</span>
        </Link></Button>
        <Button asChild variant="ghost" className={cls}><Link to="/new" aria-label="Post" title="Post">
          <PlusSquare className={iconClass} strokeWidth={1.6} />
          <span className={labelClass}>Post</span>
        </Link></Button>
        <Button asChild variant="ghost" className={cls}><Link to="/collection" aria-label="Collection" title="Collection">
          <Bookmark className={iconClass} strokeWidth={1.6} />
          <span className={labelClass}>Collection</span>
        </Link></Button>
        {user && me.data ? (
          <Button asChild variant="ghost" className={cls}><Link to="/u/$username" params={{ username: me.data.username }} aria-label="Me" title="Me">
            <User className={iconClass} strokeWidth={1.6} />
            <span className={labelClass}>Me</span>
          </Link></Button>
        ) : (
          <Button asChild variant="ghost" className={cls}><Link to="/auth" aria-label="Me" title="Me">
            <User className={iconClass} strokeWidth={1.6} />
            <span className={labelClass}>Me</span>
          </Link></Button>
        )}
    </>
  );
}

export function BottomNav() {
  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-xl">
        <NavigationEntries />
      </div>
    </nav>
  );
}
