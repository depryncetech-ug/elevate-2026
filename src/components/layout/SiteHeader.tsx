import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, User, Vote, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo, StudentAvatar } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/wishes", label: "Wall of Gratitude" },
  { to: "/vote", label: "Vote" },
] as const;

export function SiteHeader() {
  const { user, student, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const displayName = student?.full_name ?? user?.email ?? "Account";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-navy-foreground/10 bg-navy/75 backdrop-blur-xl">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-gold focus:px-3 focus:py-2 focus:text-gold-foreground">
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="Elevate Academy home">
          <Logo light />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-navy-foreground/75 transition-colors hover:text-navy-foreground"
              activeProps={{ className: "!text-gold-warm" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full p-0.5 pr-3 text-sm font-medium text-navy-foreground hover:bg-navy-foreground/10" aria-label="Account menu">
                  <StudentAvatar name={displayName} url={student?.avatar_url} size="sm" />
                  <span className="hidden max-w-[10rem] truncate sm:inline">{student?.full_name.split(" ")[0] ?? "Account"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile"><User className="mr-2 h-4 w-4" /> My dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/vote"><Vote className="mr-2 h-4 w-4" /> Vote</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><LayoutDashboard className="mr-2 h-4 w-4" /> Admin dashboard</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="gold" size="sm" className="h-9 px-4">
              <Link to="/login">Login</Link>
            </Button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-navy-foreground hover:bg-navy-foreground/10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {/* Compact mobile menu: drops down right under the navbar */}
      {open && (
        <div id="mobile-menu" className="border-t border-navy-foreground/10 bg-navy/95 backdrop-blur-xl lg:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-7xl flex-col px-3 py-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-foreground/85 transition-colors hover:bg-navy-foreground/10 hover:text-navy-foreground"
                activeProps={{ className: "bg-navy-foreground/10 !text-gold-warm" }}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-foreground/85 hover:bg-navy-foreground/10"><User className="h-4 w-4" /> My dashboard</Link>
                <Link to="/vote" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-foreground/85 hover:bg-navy-foreground/10"><Vote className="h-4 w-4" /> Vote</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-foreground/85 hover:bg-navy-foreground/10"><LayoutDashboard className="h-4 w-4" /> Admin dashboard</Link>
                )}
                <button type="button" onClick={() => { setOpen(false); signOut(); }} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy-foreground/85 hover:bg-navy-foreground/10">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy-foreground/85 hover:bg-navy-foreground/10">Login</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-navy-foreground/70">
            Celebrating Creativity, Growth, Achievement and the Next Generation of Talent.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-2 text-sm">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-navy-foreground/70 hover:text-gold-warm">{n.label}</Link>
          ))}
          <Link to="/results" className="text-navy-foreground/70 hover:text-gold-warm">Results</Link>
        </nav>
        <div className="text-sm text-navy-foreground/70 md:text-right">
          <p className="font-display font-semibold text-navy-foreground">Elevate Academy</p>
          <p className="mt-1">Class of December 2026</p>
          <p className="mt-6 text-xs">© {new Date().getFullYear()} Elevate Academy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
