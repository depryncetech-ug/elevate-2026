import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { CalendarDays, MapPin } from "lucide-react";
import { settingsQuery } from "@/lib/data";
import { getCountdown, type CountdownState } from "@/lib/countdown";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ variant = "dark", showDetails = true }: { variant?: "dark" | "light"; showDetails?: boolean }) {
  const { data: settings, isLoading } = useQuery(settingsQuery);
  const [state, setState] = useState<CountdownState | null>(null);

  useEffect(() => {
    if (!settings) return;
    const target = new Date(settings.graduation_date);
    const tick = () => setState(getCountdown(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings]);

  useEffect(() => {
    if (state?.phase === "today") {
      confetti({ particleCount: 120, spread: 80, colors: getComputedStyle(document.documentElement).getPropertyValue("--confetti-colors").split(",").map((color) => color.trim()), origin: { y: 0.4 } });
    }
  }, [state?.phase]);

  const dark = variant === "dark";

  if (isLoading || !settings || !state) {
    return (
      <div className="grid grid-cols-4 gap-3 sm:gap-4" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className={cn("h-32 rounded-2xl sm:h-40", dark && "bg-navy-foreground/10")} />
        ))}
      </div>
    );
  }

  const date = new Date(settings.graduation_date);

  return (
    <div>
      {state.phase === "upcoming" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4" role="timer" aria-live="off" aria-label="Time until graduation">
          {[
            ["Days", state.days],
            ["Hours", state.hours],
            ["Minutes", state.minutes],
            ["Seconds", state.seconds],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className={cn(
                "rounded-2xl border px-3 py-7 text-center sm:px-6 sm:py-10",
                dark ? "border-navy-foreground/15 bg-navy-foreground/5 backdrop-blur" : "bg-card shadow-soft",
              )}
            >
              <div
                key={String(value)}
                className={cn(
                  "font-display text-6xl font-extrabold tabular-nums animate-in fade-in slide-in-from-top-1 duration-300 sm:text-7xl lg:text-8xl",
                  dark ? "text-gold-warm" : "text-royal",
                )}
              >
                {label === "Days" ? value : pad(value as number)}
              </div>
              <div className={cn("mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] sm:text-xs", dark ? "text-navy-foreground/70" : "text-muted-foreground")}>
                {label}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn("rounded-2xl border p-8 text-center", dark ? "border-gold/40 bg-navy-foreground/5" : "bg-card shadow-gold")}>
          <p className={cn("font-display text-3xl font-extrabold sm:text-4xl", dark ? "text-gold-warm" : "text-royal")}>
            {state.phase === "today" ? "Today is Graduation Day! 🎓" : "Congratulations Elevate Academy Class of 2026! 🎉"}
          </p>
          {state.phase === "past" && (
            <p className={cn("mt-2", dark ? "text-navy-foreground/75" : "text-muted-foreground")}>
              Our graduates have officially crossed the stage. Thank you for celebrating with us.
            </p>
          )}
        </div>
      )}
      {showDetails && (
        <div className={cn("mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm", dark ? "text-navy-foreground/80" : "text-muted-foreground")}>
          <span className="inline-flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold" aria-hidden />
            {date.toLocaleString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Africa/Nairobi" })}
          </span>
          {settings.graduation_location && (
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" aria-hidden />
              {settings.graduation_location}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
