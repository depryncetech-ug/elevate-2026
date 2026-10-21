import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { departmentsQuery } from "@/lib/data";
import { logAdminAction } from "@/lib/admin";
import { parseTools, PROJECT_TYPES, projectDraftSchema, submissionProblems } from "@/lib/projects";
import { checkPdfFile, PROJECT_IMAGE_MAX_BYTES } from "@/lib/file-rules";
import { compressImage, extensionForMime, readFileType, uploadWithProgress } from "@/lib/storage";
import { validateImage } from "./HeadshotUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

export function AdminProjectForm({ onSaved }: { onSaved: (published: boolean) => void }) {
  const { data: departments } = useQuery(departmentsQuery);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  async function save(form: HTMLFormElement, publish: boolean) {
    const fields = new FormData(form);
    const departmentId = String(fields.get("department") ?? "");
    if (!departments?.some((department) => department.id === departmentId)) return void toast.error("Choose a department.");
    const parsed = projectDraftSchema.safeParse(Object.fromEntries(["title", "short_description", "description", "project_type", "project_url", "tools"].map((key) => [key, fields.get(key) ?? ""])));
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message);
    const imageValue = fields.get("image");
    const pdfValue = fields.get("pdf");
    const image = imageValue instanceof File && imageValue.size ? imageValue : null;
    const pdf = pdfValue instanceof File && pdfValue.size ? pdfValue : null;
    if (publish) {
      const errors = submissionProblems(parsed.data, { image: Boolean(image), pdf: Boolean(pdf) });
      if (errors.length) return void toast.error(errors[0]);
    }
    if (image) {
      const result = await validateImage(image, PROJECT_IMAGE_MAX_BYTES);
      if (!result.ok) return void toast.error(result.title, { description: result.message });
    }
    if (pdf) {
      const result = checkPdfFile(pdf);
      if (!result.ok) return void toast.error(result.title, { description: result.message });
      if (await readFileType(pdf) !== "pdf") return void toast.error("Please choose a valid PDF.");
    }
    setBusy(true);
    const uploaded: { bucket: "project-images" | "project-pdfs"; path: string }[] = [];
    let saved = false;
    try {
      const id = crypto.randomUUID();
      let cover: string | null = null;
      let document: string | null = null;
      if (image) {
        const blob = await compressImage(image, 1920);
        const path = `departments/${departmentId}/${id}/cover.${extensionForMime(blob.type)}`;
        cover = await uploadWithProgress("project-images", path, blob, setProgress);
        uploaded.push({ bucket: "project-images", path });
      }
      if (pdf) {
        const path = `departments/${departmentId}/${id}/project.pdf`;
        document = await uploadWithProgress("project-pdfs", path, pdf, setProgress);
        uploaded.push({ bucket: "project-pdfs", path });
      }
      const { error } = await supabase.from("department_projects").insert({
        id, department_id: departmentId, title: parsed.data.title,
        short_description: parsed.data.short_description, description: parsed.data.description,
        project_type: parsed.data.project_type, project_url: parsed.data.project_url || null,
        tools_used: parseTools(parsed.data.tools), cover_image_url: cover, document_url: document,
        submission_status: publish ? "approved" : "draft", is_published: publish,
        submitted_at: publish ? new Date().toISOString() : null,
      });
      if (error) throw error;
      saved = true;
      await logAdminAction("department_project_created", "project", id, `Department project added: ${parsed.data.title}`);
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin"] }), queryClient.invalidateQueries({ queryKey: ["projects"] })]);
      toast.success(publish ? "Department project published" : "Department project draft saved");
      onSaved(publish);
    } catch (error) {
      if (!saved) await Promise.all(uploaded.map(({ bucket, path }) => supabase.storage.from(bucket).remove([path])));
      const message = (error as { message?: string })?.message ?? "";
      toast.error(message.includes("ONE_PROJECT_PER_DEPARTMENT") ? "This department already has a published project. Remove the existing project first." : "Couldn't save the project. Please try again.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget, true); }} className="space-y-4">
      <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="admin-department">Department</Label><select id="admin-department" name="department" required defaultValue="" className={selectClass}><option value="" disabled>Choose department</option>{departments?.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></div>
        <div className="space-y-1.5"><Label htmlFor="admin-type">Project type</Label><select id="admin-type" name="project_type" required className={selectClass}>{PROJECT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="admin-title">Project title</Label><Input id="admin-title" name="title" required maxLength={120} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="admin-summary">Short description</Label><Input id="admin-summary" name="short_description" maxLength={200} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="admin-description">Full description</Label><Textarea id="admin-description" name="description" maxLength={5000} rows={4} /></div>
        <div className="space-y-1.5"><Label htmlFor="admin-url">Project link</Label><Input id="admin-url" name="project_url" type="url" placeholder="https://" /></div>
        <div className="space-y-1.5"><Label htmlFor="admin-tools">Tools used</Label><Input id="admin-tools" name="tools" placeholder="Figma, Photoshop, React" /></div>
        <div className="space-y-1.5"><Label htmlFor="admin-image">Project image</Label><Input id="admin-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" /></div>
        <div className="space-y-1.5"><Label htmlFor="admin-pdf">Project PDF</Label><Input id="admin-pdf" name="pdf" type="file" accept="application/pdf" /></div>
      </fieldset>
      {progress !== null && <Progress value={progress} />}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={(event) => { const form = event.currentTarget.form; if (form) void save(form, false); }}><Save className="h-4 w-4" /> Save draft</Button>
        <Button type="submit" variant="navy" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Publish project</Button>
      </div>
    </form>
  );
}