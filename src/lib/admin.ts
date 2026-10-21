import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEPARTMENT_PROJECT_SELECT, departmentProject, PROJECT_SELECT, type Project } from "@/lib/data";

export type AdminStudent = {
  id: string;
  student_code: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  department_id: string | null;
  hub_id: string | null;
  project_status: "draft" | "pending" | "approved" | "rejected" | null;
  avatar_url: string | null;
  bio: string | null;
  graduation_year: number;
  is_nominee: boolean;
  is_active: boolean;
  is_demo: boolean;
  account_linked: boolean;
  has_voted: boolean;
  votes_received: number;
  created_at: string;
};

export const adminStudentsQuery = queryOptions({
  queryKey: ["admin", "students"],
  queryFn: async (): Promise<AdminStudent[]> => {
    const { data, error } = await supabase.rpc("admin_list_students");
    if (error) throw error;
    return data as AdminStudent[];
  },
});

export const adminCountsQuery = queryOptions({
  queryKey: ["admin", "counts"],
  queryFn: async () => {
    const [votes, projects, messages, departmentProjects] = await Promise.all([
      supabase.from("votes").select("id, department_id, created_at"),
      supabase.from("projects").select("id, submission_status, department_id, hub_id"),
      supabase.from("graduation_messages").select("id", { count: "exact", head: true }),
      supabase.from("department_projects").select("id, submission_status, department_id, hub_id"),
    ]);
    if (votes.error) throw votes.error;
    if (departmentProjects.error) throw departmentProjects.error;
    return {
      votes: votes.data ?? [],
      projects: [...(projects.data ?? []), ...(departmentProjects.data ?? [])],
      messages: messages.count ?? 0,
    };
  },
});

export const adminProjectsQuery = queryOptions({
  queryKey: ["admin", "projects"],
  queryFn: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    const department = await supabase.from("department_projects").select(DEPARTMENT_PROJECT_SELECT).order("created_at", { ascending: false });
    if (department.error) throw department.error;
    return [...(data as unknown as Project[]), ...(department.data ?? []).map(departmentProject)].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
});

export type AccountStatus = "pending_activation" | "active" | "disabled";
export function accountStatus(s: { is_active: boolean; account_linked: boolean }): AccountStatus {
  if (!s.is_active) return "disabled";
  return s.account_linked ? "active" : "pending_activation";
}
export const ACCOUNT_STATUS_LABEL: Record<AccountStatus, string> = {
  pending_activation: "Pending Activation",
  active: "Active",
  disabled: "Disabled",
};

/** Records an administrator action. RLS only accepts rows from admins, stamped with their own id. */
export async function logAdminAction(action: string, entityType: string, entityId: string | null, description: string) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("audit_logs").insert({
    admin_id: data.user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    description,
  });
}
