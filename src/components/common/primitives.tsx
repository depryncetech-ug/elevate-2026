import type { ReactNode } from "react";
import { GraduationCap, type LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { departmentsQuery } from "@/lib/data";
import { useFileUrl } from "@/lib/storage";
import { Skeleton } from "@/components/ui/skeleton";
import logoAsset from "@/assets/era92-elevate-logo.png.asset.json";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="era92 · Elevate Academy"
      className={cn(
        "h-10 w-auto",
        light && "rounded-lg bg-white px-2.5 py-1.5 shadow-soft",
        className,
      )}
    />
  );
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function StudentAvatar({
  name,
  url,
  size = "md",
  className,
}: {
  name: string;
  url?: string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = { sm: "h-9 w-9 text-xs", md: "h-12 w-12 text-sm", lg: "h-20 w-20 text-xl", xl: "h-28 w-28 text-3xl" };
  const src = useFileUrl(url);
  return src ? (
    <img
      src={src}
      alt={`Photo of ${name}`}
      loading="lazy"
      className={cn("shrink-0 rounded-full object-cover ring-2 ring-gold/40", sizes[size], className)}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-navy-gradient font-display font-bold text-gold-warm ring-2 ring-gold/40",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function useDepartmentMap() {
  const { data } = useQuery(departmentsQuery);
  const map = new Map((data ?? []).map((d) => [d.id, d]));
  return { departments: data ?? [], map };
}

export function DepartmentBadge({ departmentId, className }: { departmentId: string | null | undefined; className?: string }) {
  const { map } = useDepartmentMap();
  const name = departmentId ? map.get(departmentId)?.name : undefined;
  if (!name) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-gold/40 bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground",
        className,
      )}
    >
      {name}
    </span>
  );
}

export function EmptyState({
  icon: Icon = GraduationCap,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-gold">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: string; description?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-navy-gradient text-navy-foreground">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-warm">{eyebrow}</p>}
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl lg:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-navy-foreground/75">{description}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">{eyebrow}</p>}
        <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-card">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
