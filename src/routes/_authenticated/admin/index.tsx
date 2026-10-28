import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, Building2, CheckCircle2, FolderOpen, MessageSquareHeart, Percent, UserCheck, Users, UserX } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { adminCountsQuery, adminStudentsQuery } from "@/lib/admin";
import { settingsQuery } from "@/lib/data";
import { useDepartmentMap } from "@/components/common/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview — Elevate Academy" },
      { name: "description", content: "Review student registration, projects and graduation voting participation." },
      { property: "og:title", content: "Admin Overview — Elevate Academy" },
      { property: "og:description", content: "Review student registration, projects and graduation voting participation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-3.5 shadow-soft sm:p-5">
      <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-start gap-1.5 sm:items-center sm:gap-3">
        <p className="min-w-0 text-xs font-medium leading-5 text-muted-foreground sm:text-sm">{label}</p>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary sm:h-9 sm:w-9"><Icon className="h-4 w-4" aria-hidden /></span>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold leading-none tabular-nums tracking-normal sm:leading-normal">{value}</p>
    </div>
  );
}

function AdminDashboard() {
  const students = useQuery(adminStudentsQuery);
  const counts = useQuery(adminCountsQuery);
  const { data: settings } = useQuery(settingsQuery);
  const { departments } = useDepartmentMap();
  const isMobile = useIsMobile();

  if (students.isLoading || counts.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
    );
  }
  if (students.error) return <p className="text-destructive">You do not have permission to view this data.</p>;

  const all = students.data ?? [];
  const active = all.filter((s) => s.is_active);
  const eligible = active.filter((s) => s.department_id);
  const voted = eligible.filter((s) => s.has_voted).length;
  const participation = eligible.length ? ((voted / eligible.length) * 100).toFixed(1) : "0.0";

  const chart = departments.map((d) => {
    const deptEligible = eligible.filter((s) => s.department_id === d.id);
    const deptVoted = deptEligible.filter((s) => s.has_voted).length;
    return { name: d.name.replace("Fundamentals of ", ""), votes: deptVoted, eligible: deptEligible.length };
  });

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:gap-3">
        <h2 className="min-w-0 text-xl font-extrabold tracking-normal sm:text-2xl">Overview</h2>
        <span className={settings?.voting_open ? "shrink-0 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success" : "shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground"}>
          Voting {settings?.voting_open ? "open" : "closed"}
        </span>
      </div>
      <div aria-label="Graduation statistics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat icon={Users} label="Registered students" value={all.length} />
        <Stat icon={UserCheck} label="Active students" value={active.length} />
        <Stat icon={Building2} label="Departments" value={departments.length} />
        <Stat icon={Award} label="Nominees" value={active.filter((s) => s.is_nominee).length} />
        <Stat icon={CheckCircle2} label="Votes cast" value={counts.data?.votes.length ?? 0} />
        <Stat icon={UserX} label="Yet to vote" value={eligible.length - voted} />
        <Stat icon={FolderOpen} label="Projects" value={counts.data?.projects.length ?? 0} />
        <Stat icon={MessageSquareHeart} label="Graduation messages" value={counts.data?.messages ?? 0} />
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 rounded-2xl border bg-card p-4 shadow-soft sm:p-6">
          <h3 className="text-sm font-bold leading-6 tracking-normal sm:text-base">Voting Participation by Department</h3>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-teal" />Eligible</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Voted</span></div>
          <div className="mt-4 h-80 min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout={isMobile ? "vertical" : "horizontal"} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                {isMobile ? <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} /> : <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />}
                {isMobile ? <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 10 }} interval={0} tickLine={false} /> : <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />}
                <Tooltip />
                <Bar dataKey="eligible" name="Eligible" fill="var(--color-teal)" radius={isMobile ? [0, 4, 4, 0] : [6, 6, 0, 0]} />
                <Bar dataKey="votes" name="Voted" fill="var(--color-primary)" radius={isMobile ? [0, 4, 4, 0] : [6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
         <div className="min-w-0 flex flex-col justify-center rounded-2xl bg-navy-gradient p-6 text-navy-foreground shadow-soft">
          <Percent className="h-6 w-6 text-gold-warm" aria-hidden />
          <p className="mt-4 text-sm text-navy-foreground/70">Overall participation</p>
          <p className="font-display text-5xl font-extrabold text-gold-warm">{participation}%</p>
          <p className="mt-2 text-sm text-navy-foreground/70">{voted} of {eligible.length} eligible students have voted.</p>
        </div>
      </div>
    </div>
  );
}
