import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery, type Settings } from "@/lib/data";
import { logAdminAction } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  head: () => ({
    meta: [
      { title: "Graduation Settings — Elevate Academy" },
      { name: "description", content: "Manage Elevate Academy ceremony details and portal controls." },
      { property: "og:title", content: "Graduation Settings — Elevate Academy" },
      { property: "og:description", content: "Manage Elevate Academy ceremony details and portal controls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const schema = z.object({
  graduation_title: z.string().trim().min(3).max(200),
  graduation_date: z.string().min(1, "Choose a date and time"),
  graduation_location: z.string().trim().max(200),
  graduation_description: z.string().trim().max(1000),
});

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

function SettingsPage() {
  const { data, isLoading } = useQuery(settingsQuery);
  if (isLoading || !data) return <Skeleton className="h-96 rounded-2xl" />;
  return <SettingsForm settings={data} />;
}

function SettingsForm({ settings }: { settings: Settings }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [pendingVoting, setPendingVoting] = useState<boolean | null>(null);

  const update = async (patch: Partial<Settings>, log: { action: string; description: string }) => {
    const { error } = await supabase.from("application_settings").update(patch).eq("id", 1);
    if (error) {
      toast.error("We couldn't save the settings. Please try again.");
      return false;
    }
    await logAdminAction(log.action, "settings", "1", log.description);
    queryClient.invalidateQueries({ queryKey: ["settings"] });
    return true;
  };

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(f));
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
    const newDate = new Date(parsed.data.graduation_date).toISOString();
    setSaving(true);
    const ok = await update(
      {
        graduation_title: parsed.data.graduation_title,
        graduation_date: newDate,
        graduation_location: parsed.data.graduation_location || null,
        graduation_description: parsed.data.graduation_description || null,
      },
      {
        action: newDate !== new Date(settings.graduation_date).toISOString() ? "graduation_date_changed" : "settings_updated",
        description: `Admin updated graduation details (date: ${new Date(newDate).toLocaleString()}).`,
      },
    );
    setSaving(false);
    if (ok) toast.success("Graduation settings saved");
  };

  const toggle = async (key: "messages_enabled" | "public_results_enabled", value: boolean, label: string) => {
    const ok = await update({ [key]: value }, { action: `${key}_${value ? "on" : "off"}`, description: `Admin turned ${label} ${value ? "on" : "off"}.` });
    if (ok) toast.success(`${label} ${value ? "enabled" : "disabled"}`);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <h2 className="text-2xl font-extrabold">Graduation Settings</h2>

      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
        <h3 className="font-bold">Portal controls</h3>
        {[
          {
            id: "voting",
            label: "Voting open",
            help: "Students can cast their department vote while this is on.",
            checked: settings.voting_open,
            onChange: (v: boolean) => setPendingVoting(v),
          },
          {
            id: "messages",
            label: "Graduation messages enabled",
            help: "Allow students to post on the Wall of Gratitude.",
            checked: settings.messages_enabled,
            onChange: (v: boolean) => toggle("messages_enabled", v, "Graduation messages"),
          },
          {
            id: "results",
            label: "Public results enabled",
            help: "Show vote totals on the public results page.",
            checked: settings.public_results_enabled,
            onChange: (v: boolean) => toggle("public_results_enabled", v, "Public results"),
          },
        ].map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 border-t pt-4 first:border-0 first:pt-0">
            <div>
              <Label htmlFor={s.id} className="font-semibold">{s.label}</Label>
              <p className="text-sm text-muted-foreground">{s.help}</p>
            </div>
            <Switch id={s.id} checked={s.checked} onCheckedChange={s.onChange} />
          </div>
        ))}
      </section>

      <form onSubmit={save} className="space-y-4 rounded-2xl border bg-card p-6 shadow-soft">
        <h3 className="font-bold">Ceremony details</h3>
        <div className="space-y-1.5">
          <Label htmlFor="graduation_title">Graduation title</Label>
          <Input id="graduation_title" name="graduation_title" defaultValue={settings.graduation_title} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="graduation_date">Date and time</Label>
            <Input id="graduation_date" name="graduation_date" type="datetime-local" defaultValue={toLocalInput(settings.graduation_date)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="graduation_location">Venue / location</Label>
            <Input id="graduation_location" name="graduation_location" defaultValue={settings.graduation_location ?? ""} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="graduation_description">Description</Label>
          <Textarea id="graduation_description" name="graduation_description" defaultValue={settings.graduation_description ?? ""} rows={3} />
        </div>
        <Button type="submit" variant="navy" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save details
        </Button>
      </form>

      <AlertDialog open={pendingVoting !== null} onOpenChange={(o) => !o && setPendingVoting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingVoting ? "Open voting?" : "Close voting?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingVoting
                ? "Students will be able to cast one vote for a nominee in their own department."
                : "Students will no longer be able to vote until you reopen voting."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const v = pendingVoting!;
                setPendingVoting(null);
                const ok = await update({ voting_open: v }, { action: v ? "voting_opened" : "voting_closed", description: `Admin ${v ? "opened" : "closed"} voting.` });
                if (ok) toast.success(v ? "Voting opened" : "Voting closed");
              }}
            >
              {pendingVoting ? "Open voting" : "Close voting"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
