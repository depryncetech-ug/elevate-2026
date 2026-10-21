import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { z } from "zod";
import { projectsQuery } from "@/lib/data";
import { useDebounce } from "@/hooks/use-debounce";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectCarousel } from "@/components/projects/ProjectCarousel";
import { CardGridSkeleton, EmptyState, PageHeader, useDepartmentMap } from "@/components/common/primitives";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const searchSchema = z.object({ department: z.string().optional(), q: z.string().optional() });

export const Route = createFileRoute("/projects/")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Department Projects — Elevate Class of 2026" },
      { name: "description", content: "Browse official Elevate Class of 2026 department projects across all six departments." },
      { property: "og:title", content: "Department Projects — Elevate Class of 2026" },
      { property: "og:description", content: "Official department projects in websites, design, film, motion graphics and more." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { department, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/projects/" });
  const { data, isLoading } = useQuery(projectsQuery);
  const { departments, map } = useDepartmentMap();
  const [term, setTerm] = useState(q ?? "");
  const debounced = useDebounce(term, 300).trim().toLowerCase();

  const activeDept = departments.find((d) => d.slug === department);

  const filtered = useMemo(() => {
    return (data ?? []).filter((p) => {
      if (activeDept && p.department_id !== activeDept.id) return false;
      if (!debounced) return true;
      const hay = [p.title, p.student?.full_name, map.get(p.department_id)?.name, p.project_type].join(" ").toLowerCase();
      return hay.includes(debounced);
    });
  }, [data, activeDept, debounced, map]);

  const featured = (data ?? []).filter((p) => p.is_featured);

  return (
    <>
      <PageHeader eyebrow="Showcase" title="Department Project Showcase" description="Explore the department projects of the Elevate Class of 2026." />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {featured.length > 0 && !activeDept && !debounced && (
          <section className="mb-14">
            <h2 className="mb-6 text-xl font-bold">Featured this season</h2>
            <ProjectCarousel projects={featured} />
          </section>
        )}

        <div className="sticky top-16 z-30 -mx-4 mb-8 border-b bg-background/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by project or department"
              className="pl-9"
              aria-label="Search projects"
            />
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by department">
            {[{ slug: undefined, name: "All Programs" }, ...departments].map((d) => {
              const active = d.slug === activeDept?.slug;
              return (
                <button
                  key={d.name}
                  role="tab"
                  aria-selected={active}
                  onClick={() => navigate({ search: (prev) => ({ ...prev, department: d.slug }) })}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    active ? "border-navy bg-navy text-navy-foreground" : "bg-card hover:border-gold",
                  )}
                >
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <CardGridSkeleton />
        ) : filtered.length ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
              Showing {filtered.length} {filtered.length === 1 ? "project" : "projects"}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </>
        ) : (
          <EmptyState title={data?.length ? "No projects match your search." : "No projects have been added yet."} description="Try another department or search term." />
        )}
      </div>
    </>
  );
}
