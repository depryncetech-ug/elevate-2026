ALTER TABLE public.graduation_messages ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.graduation_messages ALTER COLUMN message SET DEFAULT '';

CREATE POLICY "Gratitude videos viewable" ON storage.objects FOR SELECT USING (bucket_id = 'gratitude-videos');
CREATE POLICY "Students upload own gratitude video" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gratitude-videos' AND (storage.foldername(name))[1] = (public.current_student_id())::text);
CREATE POLICY "Students delete own gratitude video" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gratitude-videos' AND ((storage.foldername(name))[1] = (public.current_student_id())::text OR public.has_role(auth.uid(),'admin')));

CREATE OR REPLACE FUNCTION public.one_approved_project_per_department()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.submission_status = 'approved' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.department_id = NEW.department_id
      AND p.submission_status = 'approved' AND p.id <> NEW.id) THEN
    RAISE EXCEPTION 'ONE_PROJECT_PER_DEPARTMENT: this department already has an approved project';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS one_approved_project_per_department ON public.projects;
CREATE TRIGGER one_approved_project_per_department BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.one_approved_project_per_department();

UPDATE public.application_settings SET graduation_date = '2026-12-12 08:00:00+03';