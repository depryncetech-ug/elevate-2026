import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Award, Github, Globe, GraduationCap, Linkedin, Palette, Vote } from "lucide-react";
import { isValidUuid, settingsQuery, studentQuery } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { DepartmentBadge, EmptyState, StudentAvatar } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/students/$id")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Student Profile — Elevate Academy Class of Dec 2026" },
      { name: "description", content: "Profile of an Elevate Academy Class of December 2026 graduate." },
      { property: "og:title", content: "Student Profile — Elevate Academy" },
      { property: "og:description", content: "Meet a graduating student of Elevate Academy." },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const { id } = Route.useParams();
  const valid = isValidUuid(id);
  const { data: student, isLoading } = useQuery({ ...studentQuery(id), enabled: valid });
  const { data: settings } = useQuery(settingsQuery);
  const { student: me } = useAuth();

  if (valid && isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-28">
        <Skeleton className="h-28 w-28 rounded-full" />
        <Skeleton className="mt-6 h-8 w-1/2" />
      </div>
    );
  }
  if (!valid || !student) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-28">
        <EmptyState title="Student not found" action={<Button asChild variant="navy"><Link to="/students">Back to students</Link></Button>} />
      </div>
    );
  }

  const canVote =
    !!me && student.is_nominee && me.department_id === student.department_id && me.id !== student.id && !me.has_voted && settings?.voting_open;

  const links = [
    { url: student.portfolio_url, label: "Portfolio", icon: Globe },
    { url: student.github_url, label: "GitHub", icon: Github },
    { url: student.behance_url, label: "Behance", icon: Palette },
    { url: student.linkedin_url, label: "LinkedIn", icon: Linkedin },
  ].filter((l) => l.url);

  return (
    <>
      <section className="bg-navy-gradient pt-20 text-navy-foreground">
        <div className="mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6">
          <Link to="/students" className="inline-flex items-center gap-1.5 text-sm text-navy-foreground/70 hover:text-gold-warm">
            <ArrowLeft className="h-4 w-4" /> All students
          </Link>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
            <StudentAvatar name={student.full_name} url={student.avatar_url} size="xl" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DepartmentBadge departmentId={student.department_id} />
                <span className="inline-flex items-center gap-1 rounded-full bg-navy-foreground/10 px-2.5 py-0.5 text-[11px] font-semibold">
                  <GraduationCap className="h-3.5 w-3.5 text-gold-warm" aria-hidden /> Class of Dec {student.graduation_year}
                </span>
                {student.is_nominee && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-0.5 text-[11px] font-bold text-gold-foreground">
                    <Award className="h-3.5 w-3.5" aria-hidden /> Nominee
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">{student.full_name}</h1>
              <p className="mt-2 max-w-2xl text-navy-foreground/75">{student.bio ?? "Proud Elevate Academy graduate."}</p>
              {links.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {links.map(({ url, label, icon: Icon }) => (
                    <a key={label} href={url!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-navy-foreground/20 px-3 py-1.5 text-sm hover:border-gold hover:text-gold-warm">
                      <Icon className="h-4 w-4" aria-hidden /> {label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {canVote && (
              <Button asChild variant="gold" size="lg">
                <Link to="/vote"><Vote className="h-5 w-5" /> Vote</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
