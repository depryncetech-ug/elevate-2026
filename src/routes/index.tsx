import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, Camera, Code2, Cpu, Headphones, MessageSquareHeart, Palette, Sparkles, Vote } from "lucide-react";
import heroImg from "@/assets/hero-graduation.jpg";
import crowdImg from "@/assets/hero-graduates-crowd.jpg.asset.json";
import capsImg from "@/assets/hero-caps-throw.jpg.asset.json";
import bannerImg from "@/assets/hero-graduates-banner.jpg.asset.json";

const HERO_SLIDES = [heroImg, crowdImg.url, capsImg.url, bannerImg.url];
import { departmentsQuery, projectsQuery, studentsQuery, wishesQuery } from "@/lib/data";
import { Countdown } from "@/components/countdown/Countdown";
import { ProjectCarousel } from "@/components/projects/ProjectCarousel";
import { StudentCard } from "@/components/students/StudentCard";
import { WishCard } from "@/components/wishes/Wishes";
import { CardGridSkeleton, EmptyState, SectionHeading } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { WinnersSection } from "@/components/results/WinnersSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Elevate Academy Class of 2026 Cohort 7 Celebration Portal" },
      {
        name: "description",
        content: "Celebrating Creativity, Growth, Achievement and the Next Generation of Talent. Count down to graduation, explore projects and vote.",
      },
      { property: "og:title", content: "Elevate Academy Class of 2026 Cohort 7 Celebration Portal" },
      { property: "og:description", content: "Count down to graduation, explore student projects, vote and leave graduation wishes." },
    ],
  }),
  component: HomePage,
});

const DEPT_ICONS: Record<string, typeof Code2> = {
  "virtual-assistant": Headphones,
  "graphics-design": Palette,
  "website-development": Code2,
  "film-photography": Camera,
  "motion-graphics": Sparkles,
  "computer-science": Cpu,
};

function HomePage() {
  const projects = useQuery(projectsQuery);
  const students = useQuery(studentsQuery);
  const departments = useQuery(departmentsQuery);
  const wishes = useQuery(wishesQuery(6));

  const featured = (projects.data ?? []).filter((p) => p.is_featured);
  const sliderProjects = featured.length >= 3 ? featured : (projects.data ?? []).slice(0, 8);
  const projectCounts = new Map<string, number>();
  (projects.data ?? []).forEach((p) => projectCounts.set(p.student_id, (projectCounts.get(p.student_id) ?? 0) + 1));
  const featuredStudents = (students.data ?? []).filter((s) => s.is_nominee).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden text-navy-foreground">
        <div className="absolute inset-0 -z-20" aria-hidden>
          {HERO_SLIDES.map((src, i) => (
            <img key={src} src={src} alt="" loading={i === 0 ? "eager" : "lazy"} className="hero-slide absolute inset-0 h-full w-full object-cover" style={{ animationDelay: `${i * 6}s` }} />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="w-full pb-16 pt-28">
          <h1 className="rise px-4 text-center font-hero text-[clamp(2.75rem,9vw,7.5rem)] font-black uppercase leading-[0.95] tracking-tight text-balance">
            Elevate <span className="text-gold-gradient">Class Of 2026</span>
          </h1>
          <div className="rise mx-auto max-w-5xl px-4 [animation-delay:150ms] sm:px-6 lg:px-8">
            <p className="mt-6 text-center text-lg text-navy-foreground/80 sm:text-xl">
              Celebrating talent, creativity, learning and achievement.
            </p>
            <div id="countdown" className="mt-10 scroll-mt-24">
              <p className="mb-5 flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-navy-foreground/70"><span className="h-px w-8 bg-primary" aria-hidden />Counting down to graduation<span className="h-px w-8 bg-primary" aria-hidden /></p>
              <Countdown variant="dark" />
            </div>
            <div className="mt-8 flex justify-center">
              <Button asChild variant="gold" size="lg">
                <Link to="/vote"><Vote className="h-5 w-5" /> Vote for Your Outstanding Student</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <WinnersSection />



      {/* Featured projects */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Showcase"
          title="Featured Department Projects"
          description="A glimpse of the final projects our graduates are proudest of."
          action={
            <Button asChild variant="outline">
              <Link to="/projects">View all projects <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          }
        />
        {projects.isLoading ? (
          <CardGridSkeleton count={3} />
        ) : sliderProjects.length ? (
          <ProjectCarousel projects={sliderProjects} />
        ) : (
          <EmptyState title="No projects have been added yet." />
        )}
      </section>

      {/* Departments */}
      <section className="grain bg-navy py-20 text-navy-foreground sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                <span className="h-px w-8 bg-primary" aria-hidden /> Programs
              </p>
              <h2 className="mt-4 font-hero text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
                Six departments, one graduating class
              </h2>
            </div>
            <ol className="border-t border-navy-foreground/15">
              {(departments.data ?? []).map((d, i) => {
                const Icon = DEPT_ICONS[d.slug] ?? Award;
                return (
                  <li key={d.id}>
                    <Link
                      to="/projects"
                      search={{ department: d.slug }}
                      className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-navy-foreground/15 py-6 transition-colors hover:bg-navy-foreground/[0.04] sm:grid-cols-[3.5rem_1fr_auto] sm:px-2"
                    >
                      <span className="font-hero text-sm font-bold tabular-nums text-navy-foreground/40">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-3 text-xl font-bold sm:text-2xl">
                          <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                          {d.name}
                        </span>
                        {d.description && <span className="mt-1 block text-sm text-navy-foreground/60">{d.description}</span>}
                      </span>
                      <ArrowRight className="h-5 w-5 text-navy-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* Featured students */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Graduates"
          title="Meet Our Award Nominees"
          action={
            <Button asChild variant="outline">
              <Link to="/students">All students <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          }
        />
        {students.isLoading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredStudents.map((s) => (
              <StudentCard key={s.id} student={s} projectCount={projectCounts.get(s.id) ?? 0} />
            ))}
          </div>
        )}
      </section>

      {/* Wishes preview */}
      <section className="bg-secondary/60 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Wall of Gratitude"
            title="Wall of Gratitude"
            description="Video thank-you clips from the Class of 2026."
            action={
              <Button asChild variant="navy">
                <Link to="/wishes"><MessageSquareHeart className="h-4 w-4" /> Record a clip</Link>
              </Button>
            }
          />
          {wishes.isLoading ? (
            <CardGridSkeleton count={3} />
          ) : wishes.data?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {wishes.data.map((w) => (
                <WishCard key={w.id} wish={w} />
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageSquareHeart} title="No gratitude clips yet. Be the first to share one!" />
          )}
        </div>
      </section>
    </>
  );
}
