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
import { GratitudeMessages, NewWishNotice, WishCard } from "@/components/wishes/Wishes";
import { useLiveWishes } from "@/components/wishes/useLiveWishes";
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
  const wishes = useQuery(wishesQuery(60));
  const newPosts = useLiveWishes(wishes.data, "homepage-gratitude");

  const featured = (projects.data ?? []).filter((p) => p.is_featured);
  const sliderProjects = featured.length >= 3 ? featured : (projects.data ?? []).slice(0, 8);
  const projectCounts = new Map<string, number>();
  (projects.data ?? []).forEach((p) => { if (p.student_id) projectCounts.set(p.student_id, (projectCounts.get(p.student_id) ?? 0) + 1); });
  const featuredStudents = (students.data ?? []).filter((s) => s.is_nominee).slice(0, 6);

  return (
    <>
      {/* Hero */}
      <section className="home-hero relative isolate flex items-center overflow-hidden text-navy-foreground">
        <div className="absolute inset-0 -z-20" aria-hidden>
          {HERO_SLIDES.map((src, i) => (
            <img key={src} src={src} alt="" loading={i === 0 ? "eager" : "lazy"} className="hero-slide absolute inset-0 h-full w-full object-cover" style={{ animationDelay: `${i * 6}s` }} />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-hero-overlay" />
        <div className="home-hero-content w-full">
          <h1 className="home-hero-title px-4 text-center font-hero font-black uppercase leading-[1.05] text-balance">
            Elevate <span className="text-gold-gradient">Class Of 2026</span>
          </h1>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <p className="hero-support mt-4 text-center font-serif text-lg italic text-navy-foreground/80 sm:text-xl">
              Celebrating talent, creativity, learning and achievement.
            </p>
            <div id="countdown" className="hero-countdown mt-6 scroll-mt-24">
              <p className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.25em] text-gold-gradient sm:text-base">Counting down to graduation</p>
              <Countdown variant="dark" />
            </div>
            <div className="hero-vote mt-6 flex justify-center">
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
      <section className="bg-navy-gradient py-20 text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-warm">Programs</p>
          <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">Six departments, one graduating class</h2>
          <div className="no-scrollbar relative -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3" aria-label="Departments slider">
            {(departments.data ?? []).map((d) => {
              const Icon = DEPT_ICONS[d.slug] ?? Award;
              return (
                <Link
                  key={d.id}
                  to="/projects"
                  search={{ department: d.slug }}
                  className="group w-[84%] shrink-0 snap-start rounded-2xl border border-navy-foreground/10 bg-navy-foreground/5 p-6 transition-all hover:-translate-y-1 hover:border-gold/50 hover:bg-navy-foreground/10 sm:w-auto"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-gold-warm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{d.name}</h3>
                  <p className="mt-1 text-sm text-navy-foreground/70">{d.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-warm">
                    See projects <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured students */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Graduates"
          title="Meet Our Award Nominees"
        />
        {students.isLoading ? (
          <CardGridSkeleton count={3} />
        ) : (
          <div className="no-scrollbar relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3" aria-label="Nominees slider">
            {featuredStudents.map((s) => (
              <div key={s.id} className="relative w-[84%] shrink-0 snap-start sm:w-auto">
                <StudentCard student={s} projectCount={projectCounts.get(s.id) ?? 0} />
              </div>
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
            description="Messages and video thank-yous from the Class of 2026."
            action={
              <Button asChild variant="navy">
                <Link to="/wishes"><MessageSquareHeart className="h-4 w-4" /> Share gratitude</Link>
              </Button>
            }
          />
          <NewWishNotice posts={newPosts} />
          <GratitudeMessages wishes={wishes.data ?? []} newPosts={newPosts} />
          {wishes.isLoading ? (
            <CardGridSkeleton count={3} />
          ) : wishes.data?.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {wishes.data.filter((w) => w.video_url).slice(0, 6).map((w) => (
                <WishCard key={w.id} wish={w} isNew={newPosts.some((post) => post.id === w.id)} />
              ))}
            </div>
          ) : (
            <EmptyState icon={MessageSquareHeart} title="No gratitude posts yet. Be the first to share one!" />
          )}
        </div>
      </section>
    </>
  );
}
