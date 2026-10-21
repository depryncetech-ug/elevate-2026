import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ExternalLink, FileText, Star } from "lucide-react";
import { toast } from "sonner";
import type { Project } from "@/lib/data";
import { openStoredFile, parseStorageRef, useFileUrl } from "@/lib/storage";
import { DepartmentBadge, StudentAvatar } from "@/components/common/primitives";
import { cn } from "@/lib/utils";

export function ProjectCover({ project, className }: { project: Pick<Project, "cover_image_url" | "title">; className?: string }) {
  const src = useFileUrl(project.cover_image_url);
  return src ? (
    <img
      src={src}
      alt={`Cover image for ${project.title}`}
      loading="lazy"
      width={1280}
      height={800}
      className={cn("h-full w-full object-cover", className)}
    />
  ) : (
    <div className={cn("flex h-full w-full items-center justify-center bg-navy-gradient font-display text-2xl font-bold text-gold-warm", className)}>
      {project.title.slice(0, 1)}
    </div>
  );
}

/** Opens a project PDF in a new tab without downloading it. */
export function PdfLink({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  if (!parseStorageRef(value)) {
    return <a href={value} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => openStoredFile(value).catch(() => toast.error("This PDF isn't available right now."))}
    >
      {children}
    </button>
  );
}

const actionClass = "inline-flex items-center gap-1 text-sm font-semibold text-foreground underline-offset-4 hover:text-royal hover:underline";

export function ProjectCard({ project }: { project: Project }) {
  const summary = project.short_description ?? project.description;
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift",
        project.is_featured && "shadow-gold",
      )}
    >
      <Link to="/projects/$id" params={{ id: project.id }} className="relative block aspect-[16/10] overflow-hidden" tabIndex={-1} aria-hidden>
        <ProjectCover project={project} className="transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute left-3 top-3 rounded-full bg-navy/85 px-2.5 py-1 text-[11px] font-semibold text-navy-foreground backdrop-blur">
          {project.project_type}
        </span>
        {project.is_featured && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-1 text-[11px] font-bold text-gold-foreground">
            <Star className="h-3 w-3" aria-hidden /> Featured
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <DepartmentBadge departmentId={project.department_id} className="self-start" />
        <h3 className="mt-3 line-clamp-1 text-lg font-bold">{project.title}</h3>
        {project.student && <div className="mt-1 flex items-center gap-2">
          <StudentAvatar name={project.student?.full_name ?? "Elevate student"} url={project.student?.avatar_url} size="sm" className="h-7 w-7 text-[10px]" />
          <p className="text-sm font-medium text-royal">{project.student?.full_name ?? "Elevate student"}</p>
        </div>}
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-muted-foreground">{summary}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
          <Link to="/projects/$id" params={{ id: project.id }} className={actionClass}>
            View Project <ArrowUpRight className="h-4 w-4" aria-hidden />
            <span className="sr-only">: {project.title}</span>
          </Link>
          {project.project_url && (
            <a href={project.project_url} target="_blank" rel="noopener noreferrer" className={actionClass}>
              Open Project <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
          {project.document_url && (
            <PdfLink value={project.document_url} className={actionClass}>
              <FileText className="h-3.5 w-3.5" aria-hidden /> View PDF
            </PdfLink>
          )}
        </div>
      </div>
    </article>
  );
}
