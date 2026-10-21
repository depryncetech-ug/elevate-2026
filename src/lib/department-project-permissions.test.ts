import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("drizzle/migrations/0012_admin_owned_department_project_catalog.sql", "utf8");

describe("administrator department project permissions", () => {
  it("revokes student submission RPC access", () => {
    expect(migration).toMatch(/REVOKE EXECUTE ON FUNCTION public\.save_my_project\([^;]+FROM PUBLIC, anon, authenticated;/);
  });
  it("limits department creation and updates to administrators", () => {
    expect(migration).toContain('CREATE POLICY "Admins manage department projects" ON public.department_projects FOR ALL TO authenticated USING (public.has_role(auth.uid(), \'admin\')) WITH CHECK (public.has_role(auth.uid(), \'admin\'))');
  });
  it("limits project file uploads to administrators", () => {
    expect(migration).toContain('ALTER POLICY "Students upload own project files" ON storage.objects TO authenticated WITH CHECK (bucket_id IN (\'project-images\',\'project-pdfs\') AND public.has_role(auth.uid(), \'admin\'))');
  });
  it("enforces one approved project per department across both catalogs", () => {
    expect(migration).toContain("FROM public.department_projects WHERE department_id = NEW.department_id AND submission_status = 'approved'");
    expect(migration).toContain("FROM public.projects WHERE department_id = NEW.department_id AND submission_status = 'approved'");
    expect(migration).toContain("RAISE EXCEPTION 'ONE_PROJECT_PER_DEPARTMENT'");
  });
});