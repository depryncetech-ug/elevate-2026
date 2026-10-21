import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ExternalLink, FileText, Loader2, MessageSquareWarning, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { adminProjectsQuery, logAdminAction } from "@/lib/admin";
import type { Project } from "@/lib/data";
import { STATUS_LABEL, type SubmissionStatus } from "@/lib/projects";
import { openStoredFile, useFileUrl } from "@/lib/storage";
import { DepartmentBadge, StudentAvatar } from "@/components/common/primitives";
import { AdminProjectForm } from "@/components/uploads/AdminProjectForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/projects")({
  head: () => ({
    meta: [
      { title: "Department Projects — Elevate Academy Admin" },
      { name: "description", content: "Add and manage official Elevate department projects." },
      { property: "og:title", content: "Department Projects — Elevate Academy Admin" },
      { property: "og:description", content: "Manage the official department project showcase." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminProjects,
});

const TABS: SubmissionStatus[] = ["pending", "approved", "rejected", "draft"];

function AdminProjects() {
  const { data, isLoading } = useQuery(adminProjectsQuery);
  const [tab, setTab] = useState<SubmissionStatus>("approved");
  const [creating, setCreating] = useState(false);
  const list = (data ?? []).filter((p) => p.submission_status === tab);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Department Projects</h2>
        <Button variant="navy" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Add project</Button>
      </div>
      <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Add department project</DialogTitle></DialogHeader><AdminProjectForm onSaved={(published) => { setCreating(false); setTab(published ? "approved" : "draft"); }} /></DialogContent></Dialog>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = (data ?? []).filter((p) => p.submission_status === t).length;
          return (
            <Button key={t} variant={tab === t ? "navy" : "outline"} size="sm" onClick={() => setTab(t)}>
              {STATUS_LABEL[t]} ({n})
            </Button>
          );
        })}
      </div>
      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : list.length === 0 ? (
        <p className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">No projects here.</p>
      ) : (
        <div className="space-y-4">{list.map((p) => <ReviewCard key={p.id} project={p} />)}</div>
      )}
    </div>
  );
}

function ReviewCard({ project: p }: { project: Project }) {
  const queryClient = useQueryClient();
  const cover = useFileUrl(p.cover_image_url);
  const [feedback, setFeedback] = useState(p.admin_feedback ?? "");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  const update = async (patch: Record<string, unknown>, action: string, msg: string) => {
    setBusy(true);
    const { error } = await supabase.from(p.source ?? "projects").update({ ...patch, reviewed_at: new Date().toISOString() }).eq("id", p.id);
    setBusy(false);
    if (error)
      return void toast.error(
        error.message.includes("ONE_PROJECT_PER_DEPARTMENT")
          ? "This department already has an approved project. Each department can only show one — unpublish the other first."
          : "Couldn't update the project. Please try again.",
      );
    await logAdminAction(action, "project", p.id, `${msg}: ${p.title}`);
    toast.success(msg);
    setAsking(false);
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  const openPdf = () => { if (p.document_url) void openStoredFile(p.document_url).catch(() => toast.error("This PDF could not be opened.")); };

  const remove = async () => {
    if (!window.confirm(`Delete "${p.title}" permanently? This cannot be undone.`)) return;
    setBusy(true);
    const { error } = await supabase.from(p.source ?? "projects").delete().eq("id", p.id);
    setBusy(false);
    if (error) return void toast.error("Couldn't delete the project. Please try again.");
    await logAdminAction("project_deleted", "project", p.id, `Project deleted: ${p.title}`);
    toast.success("Project deleted");
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["projects"] });
  };

  return (
    <article className="grid gap-4 rounded-2xl border bg-card p-5 shadow-soft md:grid-cols-[220px_1fr]">
      {cover ? (
        <img src={cover} alt={`Cover of ${p.title}`} className="aspect-video w-full rounded-xl border object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-xl border bg-muted text-xs text-muted-foreground">No image</div>
      )}
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <DepartmentBadge departmentId={p.department_id} />
          {p.student && <><StudentAvatar name={p.student.full_name} url={p.student.avatar_url} size="sm" /><span className="text-sm font-semibold">{p.student.full_name}</span></>}
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-primary">{p.project_type}</span>
          {p.is_featured && <span className="flex items-center gap-1 text-xs font-bold text-primary"><Star className="h-3 w-3 fill-current" /> Featured</span>}
        </div>
        <h3 className="text-lg font-bold">{p.title}</h3>
        {p.short_description && <p className="text-sm text-muted-foreground">{p.short_description}</p>}
        {p.description && <p className="line-clamp-4 whitespace-pre-line text-sm">{p.description}</p>}
        {p.tools_used.length > 0 && <p className="text-xs text-muted-foreground">Tools: {p.tools_used.join(", ")}</p>}
        <div className="flex flex-wrap gap-3 text-sm">
          {p.project_url && <a href={p.project_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-primary hover:underline"><ExternalLink className="h-4 w-4" /> Open link</a>}
          {p.document_url && <button type="button" onClick={openPdf} className="flex items-center gap-1 font-medium text-primary hover:underline"><FileText className="h-4 w-4" /> View PDF</button>}
        </div>
        {p.submission_status === "rejected" && p.admin_feedback && (
          <p className="rounded-lg bg-destructive/5 p-2 text-sm"><strong>Feedback sent:</strong> {p.admin_feedback}</p>
        )}
        {asking && (
          <div className="space-y-2">
            <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={1000} rows={3} placeholder="Tell the student what to change…" />
            <div className="flex gap-2">
              <Button size="sm" variant="navy" disabled={busy || feedback.trim().length < 3}
                onClick={() => update({ submission_status: "rejected", admin_feedback: feedback.trim(), is_featured: false }, "project_changes_requested", "Changes requested")}>
                Send feedback
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>Cancel</Button>
            </div>
          </div>
        )}
        {!asking && p.submission_status === "draft" && (
          <div className="flex flex-wrap gap-2">
          {p.source === "department_projects" && <Button size="sm" variant="navy" disabled={busy} onClick={() => update({ submission_status: "approved", is_published: true }, "project_published", "Project published")}><Check className="h-4 w-4" /> Publish</Button>}
          <Button size="sm" variant="outline" disabled={busy} className="text-destructive" onClick={remove}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          </div>
        )}
        {!asking && p.submission_status !== "draft" && (
          <div className="flex flex-wrap gap-2">
            {p.submission_status !== "approved" && (
              <Button size="sm" variant="navy" disabled={busy} onClick={() => update({ submission_status: "approved", is_published: true, admin_feedback: null }, "project_approved", "Project approved")}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
              </Button>
            )}
            {p.source !== "department_projects" && <Button size="sm" variant="outline" disabled={busy} onClick={() => setAsking(true)}>
              <MessageSquareWarning className="h-4 w-4" /> Request changes
            </Button>}
            {p.submission_status === "approved" && (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => update({ is_featured: !p.is_featured }, "project_featured", p.is_featured ? "Removed from featured" : "Marked as featured")}>
                <Star className="h-4 w-4" /> {p.is_featured ? "Unfeature" : "Feature"}
              </Button>
            )}
            <Button size="sm" variant="outline" disabled={busy} className="text-destructive" onClick={remove}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
