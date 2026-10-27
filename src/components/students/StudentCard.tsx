import { Link } from "@tanstack/react-router";
import { Award } from "lucide-react";
import type { PublicStudent } from "@/lib/data";
import { DepartmentBadge, StudentAvatar } from "@/components/common/primitives";

// `projectCount` is accepted for compatibility but no longer shown on student cards.
export function StudentCard({ student }: { student: PublicStudent; projectCount?: number }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className="flex items-start gap-4">
        <StudentAvatar name={student.full_name} url={student.avatar_url} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">{student.full_name}</h3>
          <DepartmentBadge departmentId={student.department_id} className="mt-1.5" />
          {student.is_nominee && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold">
              <Award className="h-3.5 w-3.5" aria-hidden /> Award nominee
            </p>
          )}
        </div>
      </div>
      <p className="mt-4 line-clamp-3 flex-1 text-sm text-muted-foreground">{student.bio ?? "Proud Elevate Academy graduate."}</p>
      <div className="mt-5 flex items-center justify-end border-t pt-4">
        <Link
          to="/students/$id"
          params={{ id: student.id }}
          className="relative text-sm font-semibold text-royal underline-offset-4 hover:underline"
        >
          View Profile<span className="sr-only">: {student.full_name}</span>
        </Link>
      </div>
    </article>
  );
}
