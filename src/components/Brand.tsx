import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import logo from "@/assets/lebeho-logo-sm.png.asset.json";
import { useAuth } from "@/lib/auth";

export const LOGO_URL = logo.url;

export function LogoLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10">
      <img src={logo.url} alt="Loading" className="h-14 w-14 animate-pulse object-contain" />
      {label && <span className="label-tag text-muted-foreground">{label}</span>}
    </div>
  );
}

export function SplashScreen() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1100);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <img src={logo.url} alt="LeBeHo" className="h-32 w-32 animate-pulse object-contain" />
    </div>
  );
}

const EXPLORE_KEY = "lebeho_explore";

export function WelcomeGate() {
  const { user, ready } = useAuth();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(true);
  useEffect(() => {
    setDismissed(localStorage.getItem(EXPLORE_KEY) === "1");
  }, []);
  if (!ready || user || dismissed || pathname.startsWith("/auth")) return null;
  const explore = () => {
    localStorage.setItem(EXPLORE_KEY, "1");
    setDismissed(true);
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center px-6 py-10 text-center">
        <img src={logo.url} alt="LeBeHo" className="h-28 w-28 object-contain" />
        <h1 className="mt-6 text-4xl italic">Every old thing has a story.</h1>
        <p className="mt-3 text-muted-foreground">
          LeBeHo is a worldwide photo network for the past — vintage objects, old photographs, places and the people in them, shared with the stories behind them.
        </p>
        <ul className="mt-8 w-full space-y-3 text-left text-sm">
          {[
            ["Share", "Post photos of old things and old portraits of people, with their history or your memories."],
            ["Discover", "Scroll a feed of objects, faces and places from every era and corner of the world."],
            ["Connect", "Follow collectors, like, comment and save favourites to your collection."],
          ].map(([t, d]) => (
            <li key={t} className="rounded-md border border-border bg-card p-3">
              <span className="label-tag text-sepia">{t}</span>
              <p className="mt-1">{d}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 w-full space-y-3">
          <Link to="/auth" search={{ mode: "up" }} className="block w-full rounded-md bg-primary py-3 font-medium text-primary-foreground">
            Create an account
          </Link>
          <Link to="/auth" search={{ mode: "in" }} className="block w-full rounded-md border border-border bg-card py-3 font-medium">
            Sign in
          </Link>
          <button onClick={explore} className="w-full py-2 text-sm text-primary underline-offset-4 hover:underline">
            Just see around
          </button>
        </div>
      </div>
    </div>
  );
}
