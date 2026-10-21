import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { projectsQuery, studentsQuery } from "@/lib/data";
import { useDebounce } from "@/hooks/use-debounce";
import { StudentCard } from "@/components/students/StudentCard";
import { CardGridSkeleton, EmptyState, PageHeader, useDepartmentMap } from "@/components/common/primitives";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Graduating Students — Elevate Academy Class of Dec 2026" },
      { name: "description", content: "Meet the graduating students of Elevate Academy across all six departments." },
      { property: "og:title", content: "Graduating Students — Elevate Academy" },
      { property: "og:description", content: "Meet the Elevate Academy Class of December 2026." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { data: students, isLoading } = useQuery(studentsQuery);
  const { data: projects } = useQuery(projectsQuery);
  const { departments, map } = useDepartmentMap();
  const [dept, setDept] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const q = useDebounce(term, 300).trim().toLowerCase();

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    (projects ?? []).forEach((p) => { if (p.student_id) m.set(p.student_id, (m.get(p.student_id) ?? 0) + 1); });
    return m;
  }, [projects]);

  const filtered = (students ?? []).filter((s) => {
    if (dept && s.department_id !== dept) return false;
    if (!q) return true;
    return `${s.full_name} ${map.get(s.department_id ?? "")?.name ?? ""}`.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader eyebrow="Directory" title="Graduating Students" description="Meet the talented graduates of the Elevate Academy Class of December 2026." />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search students" className="pl-9" aria-label="Search students" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter by department">
            {[{ id: null, name: "All Programs" }, ...departments].map((d) => (
              <button
                key={d.name}
                onClick={() => setDept(d.id)}
                aria-pressed={dept === d.id}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  dept === d.id ? "border-navy bg-navy text-navy-foreground" : "bg-card hover:border-gold",
                )}
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>
        {isLoading ? (
          <CardGridSkeleton />
        ) : filtered.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <StudentCard key={s.id} student={s} projectCount={counts.get(s.id) ?? 0} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="No students found." description="Try a different search or department." />
        )}
      </div>
    </>
  );
}
