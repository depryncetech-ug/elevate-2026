import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Students' email/phone are not readable by the public; always select explicit columns.
export const STUDENT_PUBLIC_COLUMNS =
  "id, full_name, department_id, hub_id, avatar_url, bio, graduation_year, portfolio_url, github_url, behance_url, linkedin_url, is_nominee, is_active, is_demo";

export type Department = { id: string; name: string; slug: string; description: string | null };

export type PublicStudent = {
  id: string;
  full_name: string;
  department_id: string | null;
  hub_id: string | null;
  avatar_url: string | null;
  bio: string | null;
  graduation_year: number;
  portfolio_url: string | null;
  github_url: string | null;
  behance_url: string | null;
  linkedin_url: string | null;
  is_nominee: boolean;
  is_active: boolean;
  is_demo: boolean;
};

export type Project = {
  id: string;
  student_id: string;
  department_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  project_type: string;
  project_url: string | null;
  video_url: string | null;
  document_url: string | null;
  short_description: string | null;
  tools_used: string[];
  submission_status: "draft" | "pending" | "approved" | "rejected";
  admin_feedback: string | null;
  submitted_at: string | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  student: { id: string; full_name: string; avatar_url: string | null } | null;
};

export type Settings = {
  graduation_date: string;
  graduation_title: string;
  graduation_location: string | null;
  graduation_description: string | null;
  voting_open: boolean;
  messages_enabled: boolean;
  public_results_enabled: boolean;
};

export type Wish = {
  id: string;
  message: string;
  video_url: string | null;
  created_at: string;
  is_approved: boolean;
  student_id: string;
  student: { id: string; full_name: string; avatar_url: string | null; department_id: string | null } | null;
};

export const PROJECT_SELECT = `id, student_id, department_id, title, short_description, description, cover_image_url, project_type, project_url, video_url, document_url, tools_used, submission_status, admin_feedback, submitted_at, is_featured, is_published, created_at, updated_at, student:students(id, full_name, avatar_url)`;

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async (): Promise<Settings> => {
    const { data, error } = await supabase
      .from("application_settings")
      .select(
        "graduation_date, graduation_title, graduation_location, graduation_description, voting_open, messages_enabled, public_results_enabled",
      )
      .eq("id", 1)
      .single();
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

export const departmentsQuery = queryOptions({
  queryKey: ["departments"],
  queryFn: async (): Promise<Department[]> => {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name, slug, description")
      .order("name");
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60_000,
});

export type Hub = { id: string; name: string; slug: string; description: string | null; is_active: boolean };

export const hubsQuery = queryOptions({
  queryKey: ["hubs"],
  queryFn: async (): Promise<Hub[]> => {
    const { data, error } = await supabase.from("hubs").select("id, name, slug, description, is_active").order("name");
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60_000,
});

export const studentsQuery = queryOptions({
  queryKey: ["students"],
  queryFn: async (): Promise<PublicStudent[]> => {
    const { data, error } = await supabase
      .from("students")
      .select(STUDENT_PUBLIC_COLUMNS)
      .eq("is_active", true)
      .order("full_name");
    if (error) throw error;
    return data as PublicStudent[];
  },
  staleTime: 60_000,
});

export const studentQuery = (id: string) =>
  queryOptions({
    queryKey: ["student", id],
    queryFn: async (): Promise<PublicStudent | null> => {
      const { data, error } = await supabase
        .from("students")
        .select(STUDENT_PUBLIC_COLUMNS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as PublicStudent | null;
    },
  });

export const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_SELECT)
      .eq("is_published", true)
      .eq("submission_status", "approved")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as Project[];
  },
  staleTime: 60_000,
});

export const projectQuery = (id: string) =>
  queryOptions({
    queryKey: ["project", id],
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase.from("projects").select(PROJECT_SELECT).eq("id", id).maybeSingle();
      if (error) throw error;
      return data as unknown as Project | null;
    },
  });

/** The signed-in student's own project (any status). RLS only returns rows they own. */
export const myProjectQuery = (studentId: string) =>
  queryOptions({
    queryKey: ["my-project", studentId],
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase
        .from("projects")
        .select(PROJECT_SELECT)
        .eq("student_id", studentId)
        .order("created_at")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Project | null;
    },
  });

export const wishesQuery = (limit = 60) =>
  queryOptions({
    queryKey: ["wishes", limit],
    queryFn: async (): Promise<Wish[]> => {
      const { data, error } = await supabase
        .from("graduation_messages")
        .select("id, message, video_url, created_at, is_approved, student_id, student:students(id, full_name, avatar_url, department_id)")
        .eq("is_approved", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as unknown as Wish[];
    },
  });

export const publicResultsQuery = queryOptions({
  queryKey: ["public-results"],
  queryFn: async () => {
    const { data, error } = await supabase.rpc("get_public_results");
    if (error) throw error;
    return data;
  },
});

export function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
