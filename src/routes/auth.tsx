import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LeBeHo" },
      { name: "description", content: "Join LeBeHo to share old things and follow collectors worldwide." },
      { property: "og:title", content: "Sign in — LeBeHo" },
      { property: "og:description", content: "Join LeBeHo to share old things and follow collectors worldwide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { mode?: "in" | "up" } => (s["mode"] === "up" || s["mode"] === "in" ? { mode: s["mode"] } : {}),
  component: AuthPage,
});

const field = "w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up">(search.mode ?? "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { username } },
      });
      if (error) toast.error(error.message);
      else setSent(true);
    }
    setBusy(false);
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error("Google sign-in failed");
  };

  if (sent)
    return (
      <div className="px-6 py-16 text-center">
        <h1 className="text-3xl">Check your inbox</h1>
        <p className="mt-2 text-muted-foreground">We sent a confirmation link to {email}.</p>
      </div>
    );

  return (
    <div className="px-6 py-10">
      <h1 className="text-4xl italic">{mode === "in" ? "Welcome back" : "Join LeBeHo"}</h1>
      <p className="mt-2 text-muted-foreground">Every old thing has a story. Share yours.</p>
      <button onClick={google} className="mt-8 w-full rounded-md border border-border bg-card py-2.5 text-sm font-medium">
        Continue with Google
      </button>
      <div className="label-tag my-6 text-center text-muted-foreground">or</div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "up" && (
          <input className={field} placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))} maxLength={24} />
        )}
        <input className={field} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className={field} type="password" placeholder="Password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy} className="w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50">
          {mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 w-full text-sm text-primary">
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
