CREATE TABLE public.department_projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), department_id uuid NOT NULL REFERENCES public.departments(id), title text NOT NULL,
 short_description text, description text, project_type text NOT NULL DEFAULT 'Other', project_url text, cover_image_url text, document_url text, video_url text,
 tools_used text[] NOT NULL DEFAULT '{}', submission_status text NOT NULL DEFAULT 'draft' CHECK (submission_status IN ('draft','approved')),
 is_featured boolean NOT NULL DEFAULT false, is_published boolean NOT NULL DEFAULT true, admin_feedback text, submitted_at timestamptz, reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), hub_id uuid
);
GRANT SELECT ON public.department_projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_projects TO authenticated;
GRANT ALL ON public.department_projects TO service_role;
ALTER TABLE public.department_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published department projects" ON public.department_projects FOR SELECT TO anon, authenticated USING (is_published AND submission_status = 'approved');
CREATE POLICY "Admins manage department projects" ON public.department_projects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER department_projects_updated_at BEFORE UPDATE ON public.department_projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE FUNCTION public.guard_department_project_limit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.submission_status = 'approved' THEN
  PERFORM id FROM public.departments WHERE id = NEW.department_id FOR UPDATE;
  IF EXISTS (SELECT 1 FROM public.department_projects WHERE department_id = NEW.department_id AND submission_status = 'approved' AND id <> NEW.id)
    OR EXISTS (SELECT 1 FROM public.projects WHERE department_id = NEW.department_id AND submission_status = 'approved' AND id <> NEW.id) THEN
   RAISE EXCEPTION 'ONE_PROJECT_PER_DEPARTMENT';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER department_projects_limit BEFORE INSERT OR UPDATE ON public.department_projects FOR EACH ROW EXECUTE FUNCTION public.guard_department_project_limit();
CREATE OR REPLACE FUNCTION public.one_approved_project_per_department() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN RETURN public.guard_department_project_limit(); END; $$;
-- Replace the legacy trigger to share the cross-catalog limit directly.
DROP TRIGGER IF EXISTS one_approved_project_per_department ON public.projects;
CREATE TRIGGER one_approved_project_per_department BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.guard_department_project_limit();
COMMENT ON FUNCTION public.save_my_project(text,text,text,text,text,text,text,text[],boolean) IS 'DEPRECATED: student submissions retired; department projects are administrator-managed.';
REVOKE EXECUTE ON FUNCTION public.save_my_project(text,text,text,text,text,text,text,text[],boolean) FROM PUBLIC, anon, authenticated;
ALTER POLICY "Students upload own project files" ON storage.objects TO authenticated WITH CHECK (bucket_id IN ('project-images','project-pdfs') AND public.has_role(auth.uid(), 'admin'));
ALTER POLICY "Students update own project files" ON storage.objects TO authenticated USING (bucket_id IN ('project-images','project-pdfs') AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id IN ('project-images','project-pdfs') AND public.has_role(auth.uid(), 'admin'));
ALTER POLICY "Students delete own project files" ON storage.objects TO authenticated USING (bucket_id IN ('project-images','project-pdfs') AND public.has_role(auth.uid(), 'admin'));
ALTER POLICY "Project files readable when approved" ON storage.objects TO authenticated USING (
 bucket_id IN ('project-images','project-pdfs') AND auth.uid() IS NOT NULL AND (
 (storage.foldername(name))[1] = public.current_student_id()::text OR public.has_role(auth.uid(), 'admin') OR
 EXISTS (SELECT 1 FROM public.projects p WHERE p.is_published AND p.submission_status = 'approved' AND ('storage:' || storage.objects.bucket_id || '/' || storage.objects.name IN (p.cover_image_url,p.document_url))) OR
 EXISTS (SELECT 1 FROM public.department_projects p WHERE p.is_published AND p.submission_status = 'approved' AND ('storage:' || storage.objects.bucket_id || '/' || storage.objects.name IN (p.cover_image_url,p.document_url)))
 ));