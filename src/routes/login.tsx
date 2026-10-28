import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { requestActivation } from "@/lib/activation.functions";
import { Logo } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Student Login — Elevate Academy Graduation Portal" },
      { name: "description", content: "Sign in with your registered Elevate Academy email to vote and post graduation wishes." },
      { property: "og:title", content: "Student Login — Elevate Academy" },
      { property: "og:description", content: "Sign in to the Elevate Academy Class of December 2026 portal." },
    ],
  }),
  component: LoginPage,
});

const emailSchema = z.string().trim().email("Enter a valid email address").max(255);
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function friendlyAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first — check your inbox.";
  if (/already registered/i.test(message)) return "An account with this email already exists. Try signing in.";
  if (/weak|pwned|leaked/i.test(message)) return "Please choose a stronger password.";
  return "Something went wrong. Please try again.";
}

function LoginPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    if (ready && user) navigate({ to: "/profile", replace: true });
  }, [ready, user, navigate]);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = emailSchema.safeParse(form.get("email"));
    if (!email.success) { toast.error(email.error.issues[0]?.message); return; }

    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSentTo(email.data);
        return;
      }
      if (mode === "signup") {
        const studentId = String(form.get("student_id") ?? "").trim();
        if (!studentId) { toast.error("Enter your Student ID"); return; }
        setNotice(null);
        const res = await requestActivation({ data: { email: email.data, studentId, origin: window.location.origin } });
        if (res.status === "sent") { setSentTo(email.data); return; }
        setNotice(
          res.status === "not_registered"
            ? { title: "Student Not Registered", body: "We could not verify your details in the Elevate Academy student list. Please contact the administrator." }
            : res.status === "inactive"
              ? { title: "Account inactive", body: "Your Elevate Academy student account is currently inactive. Please contact the administrator." }
              : res.status === "already_active"
                ? { title: "Account already activated", body: "Sign in with your email and password, or use Forgot password to set a new one." }
                : { title: "Something went wrong", body: "We couldn't send your activation email. Please try again shortly." },
        );
        return;
      }
      const password = passwordSchema.safeParse(form.get("password"));
      if (!password.success) { toast.error(password.error.issues[0]?.message); return; }
      {
        const { error } = await supabase.auth.signInWithPassword({ email: email.data, password: password.data });
        if (error && /email not confirmed/i.test(error.message)) {
          await supabase.auth.resend({ type: "signup", email: email.data });
          navigate({ to: "/verify-email", search: { email: email.data } });
          return;
        }
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err) {
      toast.error(friendlyAuthError(err instanceof Error ? err.message : ""));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-navy-gradient px-4 pb-16 pt-24">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-20 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative w-full max-w-md rounded-3xl border bg-card p-6 shadow-lift sm:p-8">
        <Logo className="justify-center" />
        {sentTo ? (
          <div className="mt-8 text-center">
            <MailCheck className="mx-auto h-12 w-12 text-gold" aria-hidden />
            <h1 className="mt-4 text-2xl font-bold">Check your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a link to <strong className="text-foreground">{sentTo}</strong>. Open it to {mode === "forgot" ? "reset your password" : "create your password and activate your account"}.
            </p>
            <Button variant="outline" className="mt-6" onClick={() => { setSentTo(null); setMode("signin"); }}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            <h1 className="mt-6 text-center text-2xl font-bold">
              {mode === "forgot" ? "Reset your password" : "Student & Admin Login"}
            </h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Use the email address registered with Elevate Academy.
            </p>
            {mode !== "forgot" ? (
              <Tabs value={mode} onValueChange={(v) => { setMode(v as "signin" | "signup"); setNotice(null); }} className="mt-6">
                <p className="text-center text-sm text-muted-foreground">
                  New student? <Link to="/register" className="font-medium text-primary hover:underline">Create your account</Link>
                </p>
                <TabsContent value={mode}>
                  <form onSubmit={handle} className="mt-4 space-y-4" noValidate>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" autoComplete="email" required />
                    </div>
                    {mode === "signin" ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {mode === "signin" && (
                          <button type="button" className="text-xs font-medium text-royal hover:underline" onClick={() => setMode("forgot")}>
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} />
                    </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="student_id">Student ID</Label>
                        <Input id="student_id" name="student_id" autoComplete="off" placeholder="e.g. ELV2026001" required maxLength={40} />
                      </div>
                    )}
                    {mode === "signup" && (
                      <p className="text-xs text-muted-foreground">
                        First time here? Enter the email and Student ID registered by Elevate Academy. We'll email you a secure link to create your password.
                      </p>
                    )}
                    {notice && (
                      <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <p className="font-bold text-destructive">{notice.title}</p>
                        <p className="mt-0.5 text-muted-foreground">{notice.body}</p>
                      </div>
                    )}
                    <Button type="submit" variant="navy" className="w-full" disabled={busy}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} {mode === "signin" ? "Sign in" : "Send activation link"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            ) : (
              <form onSubmit={handle} className="mt-6 space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" autoComplete="email" required />
                </div>
                <Button type="submit" variant="navy" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
                </Button>
                <button type="button" className="w-full text-sm text-muted-foreground hover:underline" onClick={() => setMode("signin")}>
                  Back to sign in
                </button>
              </form>
            )}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:underline">← Back to the portal</Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
