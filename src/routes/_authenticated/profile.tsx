import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Loader2, MessageSquareHeart, Users, Vote } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { settingsQuery } from "@/lib/data";
import { Countdown } from "@/components/countdown/Countdown";
import { NotRegisteredNotice } from "@/components/common/AccountNotice";
import { PageHeader, StudentAvatar } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { HeadshotUploader } from "@/components/uploads/HeadshotUploader";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "My Dashboard — Elevate Academy Graduation Portal" },
      { name: "description", content: "Your Elevate Academy graduation dashboard: profile, department and voting status." },
      { property: "og:title", content: "My Dashboard — Elevate Academy" },
      { property: "og:description", content: "Your graduation dashboard." },
    ],
  }),
  component: ProfilePage,
});

const url = z.string().trim().max(300).url("Enter a full link starting with https://").or(z.literal(""));
const profileSchema = z.object({
  bio: z.string().trim().max(600, "Bio must be 600 characters or fewer"),
  portfolio: url,
  github: url,
  behance: url,
  linkedin: url,
});

function ProfilePage() {
  const { student, studentLoading } = useAuth();
  const { data: settings } = useQuery(settingsQuery);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  if (studentLoading) {
    return (
      <>
        <PageHeader title="Loading your dashboard…" />
        <div className="mx-auto max-w-5xl px-4 py-10"><Skeleton className="h-40 w-full rounded-2xl" /></div>
      </>
    );
  }
  if (!student) {
    return (
      <>
        <PageHeader eyebrow="My dashboard" title="Welcome" />
        <div className="px-4 py-12"><NotRegisteredNotice /></div>
      </>
    );
  }

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = profileSchema.safeParse({
      bio: f.get("bio") ?? "",
      portfolio: f.get("portfolio") ?? "",
      github: f.get("github") ?? "",
      behance: f.get("behance") ?? "",
      linkedin: f.get("linkedin") ?? "",
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    setSaving(true);
    const { error } = await supabase.rpc("update_my_profile", {
      _bio: parsed.data.bio,
      _portfolio_url: parsed.data.portfolio,
      _github_url: parsed.data.github,
      _behance_url: parsed.data.behance,
      _linkedin_url: parsed.data.linkedin,
    });
    setSaving(false);
    if (error) { toast.error("We couldn't save your profile. Please try again."); return; }
    toast.success("Profile updated");
    queryClient.invalidateQueries();
  };

  return (
    <>
      <PageHeader eyebrow="My dashboard" title={`Welcome, ${student.full_name}`}>
        <div className="mt-6 flex items-center gap-4">
          <StudentAvatar name={student.full_name} url={student.avatar_url} size="lg" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-navy-foreground/60">Your Department</p>
            <p className="text-lg font-bold text-gold-warm">{student.department_name ?? "Not assigned"}</p>
          </div>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 shadow-soft md:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Voting Status</p>
            {student.has_voted ? (
              <>
                <p className="mt-3 flex items-center gap-2 text-xl font-bold text-success">
                  <CheckCircle2 className="h-6 w-6" aria-hidden /> Vote Submitted ✓
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Thank you for participating in the Elevate Academy Graduation Awards.</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-xl font-bold">Not Voted</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {settings?.voting_open ? "Choose your favourite student in your department." : "Voting is currently closed."}
                </p>
                <Button asChild variant="gold" className="mt-4 w-full" disabled={!settings?.voting_open}>
                  <Link to="/vote"><Vote className="h-4 w-4" /> Cast Your Vote</Link>
                </Button>
              </>
            )}
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-soft md:col-span-2">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Graduation countdown</p>
            <Countdown variant="light" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { to: "/vote" as const, icon: Users, label: "View Department Nominees" },
            { to: "/wishes" as const, icon: MessageSquareHeart, label: "Graduation Wall" },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="flex items-center gap-3 rounded-2xl border bg-card p-5 font-semibold shadow-soft transition-all hover:-translate-y-0.5 hover:border-gold">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-gold"><Icon className="h-5 w-5" aria-hidden /></span>
              {label}
            </Link>
          ))}
        </div>

        <div id="photo" className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-bold">Your profile picture</h2>
          <p className="mb-4 text-sm text-muted-foreground">Upload a clear headshot. It appears on your student card.</p>
          <HeadshotUploader studentId={student.id} name={student.full_name} avatarUrl={student.avatar_url} />
        </div>

        <form onSubmit={save} className="rounded-2xl border bg-card p-6 shadow-soft">
          <h2 className="text-lg font-bold">Your public profile</h2>
          <p className="text-sm text-muted-foreground">Your email is never shown publicly.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bio">Short bio</Label>
              <Textarea id="bio" name="bio" defaultValue={student.bio ?? ""} maxLength={600} rows={3} />
            </div>
            {([
              ["portfolio", "Portfolio URL", student.portfolio_url],
              ["github", "GitHub", student.github_url],
              ["behance", "Behance", student.behance_url],
              ["linkedin", "LinkedIn", student.linkedin_url],
            ] as const).map(([name, label, value]) => (
              <div key={name} className="space-y-1.5">
                <Label htmlFor={name}>{label}</Label>
                <Input id={name} name={name} type="url" placeholder="https://" defaultValue={value ?? ""} />
              </div>
            ))}
          </div>
          <Button type="submit" variant="navy" className="mt-5" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save profile
          </Button>
        </form>
      </div>
    </>
  );
}
