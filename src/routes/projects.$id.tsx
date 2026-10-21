import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { isValidUuid, projectQuery } from "@/lib/data";
import { PdfLink, ProjectCover } from "@/components/projects/ProjectCard";
import { useFileUrl } from "@/lib/storage";
import { STATUS_LABEL } from "@/lib/projects";
import { DepartmentBadge, EmptyState, StudentAvatar } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/projects/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Project Details — Elevate Academy Showcase" },
      { name: "description", content: "View an official Elevate Class of 2026 department project." },
      { property: "og:title", content: "Project Details — Elevate Academy Showcase" },
      { property: "og:description", content: "An official department project at Elevate." },
    ],
  }),
  component: ProjectDetail,
});

function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function MediaPreview({ videoUrl, projectUrl, title }: { videoUrl: string | null; projectUrl: string | null; title: string }) {
  const candidate = videoUrl ?? projectUrl;
  if (!candidate) return null;
  const embed = embedUrl(candidate);
  if (embed) {
    return (
      <div className="aspect-video overflow-hidden rounded-2xl border bg-navy">
        <iframe src={embed} title={`${title} video`} className="h-full w-full" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" loading="lazy" />
      </div>
    );
  }
  if (/\.(mp4|webm|mov)(\?|$)/i.test(candidate)) {
    return <video src={candidate} controls preload="metadata" className="w-full rounded-2xl border bg-navy" />;
  }
  return null;
}

function ProjectDetail() {
  const { id } = Route.useParams();
  const valid = isValidUuid(id);
  const { data: project, isLoading } = useQuery({ ...projectQuery(id), enabled: valid });

  if (valid && isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="mt-6 h-8 w-1/2" />
      </div>
    );
  }
  if (!valid || !project) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-28">
        <EmptyState title="Project not found" description="This project may have been removed or unpublished." action={<Button asChild variant="navy"><Link to="/projects">Back to projects</Link></Button>} />
      </div>
    );
  }

  const pdfSrc = project.document_url;
  const hasEmbed = !!(project.video_url || (project.project_url && embedUrl(project.project_url)));

  return (
    <article>
      <div className="bg-navy-gradient pt-20 text-navy-foreground">
        <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6">
          <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-navy-foreground/70 hover:text-gold-warm">
            <ArrowLeft className="h-4 w-4" /> All projects
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <DepartmentBadge departmentId={project.department_id} />
            <span className="rounded-full bg-navy-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold">{project.project_type}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl">{project.title}</h1>
          {project.short_description && <p className="mt-3 max-w-2xl text-navy-foreground/80">{project.short_description}</p>}
          {project.student && (
            <Link to="/students/$id" params={{ id: project.student.id }} className="mt-5 inline-flex items-center gap-3 hover:text-gold-warm">
              <StudentAvatar name={project.student.full_name} url={project.student.avatar_url} size="sm" />
              <span className="font-semibold">{project.student.full_name}</span>
            </Link>
          )}
        </div>
      </div>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        {project.submission_status !== "approved" && (
          <div role="status" className="rounded-2xl border border-gold/40 bg-accent p-4 text-sm">
            <p className="font-bold">Status: {STATUS_LABEL[project.submission_status]}</p>
            <p className="text-muted-foreground">Only you and the Elevate Academy team can see this project until it is approved.</p>
          </div>
        )}
        {hasEmbed ? (
          <MediaPreview videoUrl={project.video_url} projectUrl={project.project_url} title={project.title} />
        ) : (
          <div className="aspect-[16/9] overflow-hidden rounded-2xl border shadow-soft">
            <ProjectCover project={project} />
          </div>
        )}
        <div className="grid gap-8 md:grid-cols-[1fr_260px]">
          <div>
            <h2 className="text-xl font-bold">About this project</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-muted-foreground">{project.description ?? project.short_description ?? "No description provided."}</p>
            {project.tools_used?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">Tools &amp; technologies</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.tools_used.map((t) => <span key={t} className="rounded-full border bg-card px-3 py-1 text-xs font-semibold">{t}</span>)}
                </div>
              </div>
            )}
          </div>
          <aside className="space-y-3">
            {project.project_url && (
              <Button asChild variant="gold" className="w-full">
                <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                  Open project <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            {project.document_url && (
              <Button asChild variant="outline" className="w-full">
                <PdfLink value={project.document_url}>
                  <FileText className="h-4 w-4" /> View Project PDF
                </PdfLink>
              </Button>
            )}
            {project.student && (
              <Button asChild variant="ghost" className="w-full">
                <Link to="/students/$id" params={{ id: project.student.id }}>View student profile</Link>
              </Button>
            )}
          </aside>
        </div>
        {pdfSrc && <InlinePdf value={pdfSrc} title={project.title} />}
      </div>
    </article>
  );
}

function InlinePdf({ value, title }: { value: string; title: string }) {
  const src = useFileUrl(value);
  const isPdf = value.startsWith("storage:project-pdfs/") || /\.pdf(\?|$)/i.test(value);
  if (!src || !isPdf) return null;
  return <iframe src={src} title={`${title} PDF`} className="hidden h-[70vh] w-full rounded-2xl border md:block" loading="lazy" />;
}
