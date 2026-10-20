import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/admin";
import type { Wish } from "@/lib/data";
import { StudentAvatar } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  head: () => ({
    meta: [
      { title: "Moderate Wishes — Elevate Academy" },
      { name: "description", content: "Review and moderate Elevate Academy gratitude clips." },
      { property: "og:title", content: "Moderate Wishes — Elevate Academy" },
      { property: "og:description", content: "Review and moderate Elevate Academy gratitude clips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminMessages,
});

function AdminMessages() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async (): Promise<Wish[]> => {
      const { data, error } = await supabase
        .from("graduation_messages")
        .select("id, message, video_url, created_at, is_approved, student_id, student:students(id, full_name, avatar_url, department_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Wish[];
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["wishes"] });
  };

  const toggle = async (w: Wish) => {
    const { error } = await supabase.from("graduation_messages").update({ is_approved: !w.is_approved }).eq("id", w.id);
    if (error) { toast.error("We couldn't update this message."); return; }
    await logAdminAction(w.is_approved ? "message_hidden" : "message_restored", "message", w.id, `Admin ${w.is_approved ? "hid" : "restored"} a message by ${w.student?.full_name}.`);
    refresh();
  };

  const remove = async (w: Wish) => {
    if (!confirm("Delete this message permanently?")) return;
    const { error } = await supabase.from("graduation_messages").delete().eq("id", w.id);
    if (error) { toast.error("We couldn't delete this message."); return; }
    await logAdminAction("message_deleted", "message", w.id, `Admin deleted graduation message by ${w.student?.full_name}.`);
    toast.success("Message deleted");
    refresh();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold">Wall of Gratitude</h2>
      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : (
        <ul className="space-y-3">
          {(data ?? []).map((w) => (
            <li key={w.id} className={w.is_approved ? "rounded-2xl border bg-card p-4 shadow-soft" : "rounded-2xl border border-dashed bg-muted/50 p-4"}>
              <div className="flex items-start gap-3">
                <StudentAvatar name={w.student?.full_name ?? "?"} url={w.student?.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {w.student?.full_name}{" "}
                    <span className="font-normal text-muted-foreground">· {formatDistanceToNow(new Date(w.created_at), { addSuffix: true })}</span>
                    {!w.is_approved && <span className="ml-2 rounded bg-destructive/10 px-1.5 text-xs text-destructive">Hidden</span>}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm">{w.message}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => toggle(w)} aria-label={w.is_approved ? "Hide message" : "Show message"}>
                  {w.is_approved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(w)} aria-label="Delete message">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
          {!data?.length && <p className="text-muted-foreground">No gratitude clips yet.</p>}
        </ul>
      )}
    </div>
  );
}
