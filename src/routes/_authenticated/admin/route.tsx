import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Award, FolderOpen, Home, LayoutDashboard, LogOut, Menu, MessageSquareHeart, Settings, ShieldAlert, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    return { isAdmin: !!data };
  },
  head: () => ({
    meta: [
      { title: "Super Admin — Elevate Academy Graduation Portal" },
      { name: "description", content: "Manage students, nominees, voting and graduation settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/projects", label: "Projects", icon: FolderOpen },
  { to: "/admin/nominees", label: "Nominees", icon: Award },
  { to: "/admin/messages", label: "Wall of Gratitude", icon: MessageSquareHeart },
  { to: "/admin/settings", label: "Graduation Settings", icon: Settings },
] as const;

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut } = useAuth();
  return (
    <div className="flex h-full flex-col bg-sidebar p-4 text-sidebar-foreground">
      <Link to="/admin" className="mb-8 px-2 pt-2" onClick={onNavigate}>
        <Logo light />
      </Link>
      <nav aria-label="Admin" className="flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, ...rest }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            activeOptions={{ exact: "exact" in rest }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground" }}
          >
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border pt-4">
        <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent">
          <Home className="h-4 w-4" aria-hidden /> View portal
        </Link>
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent">
          <LogOut className="h-4 w-4" aria-hidden /> Logout
        </button>
      </div>
    </div>
  );
}

function AdminLayout() {
  const { isAdmin } = Route.useRouteContext();
  const [open, setOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-gradient px-4">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-lift">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" aria-hidden />
          <h1 className="mt-4 text-xl font-bold">Unauthorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">You do not have permission to access this page.</p>
          <Button asChild variant="navy" className="mt-6"><Link to="/">Back to the portal</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b glass px-4 sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open admin menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-0 p-0">
              <SheetTitle className="sr-only">Admin navigation</SheetTitle>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="font-display text-base font-bold sm:text-lg">Elevate Academy Graduation 2026</h1>
          <span className="ml-auto rounded-full bg-gold-gradient px-3 py-1 text-xs font-bold text-gold-foreground">Super Admin</span>
        </header>
        <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
