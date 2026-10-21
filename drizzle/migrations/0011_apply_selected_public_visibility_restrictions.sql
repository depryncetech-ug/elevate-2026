ALTER POLICY "Hubs are public" ON public.hubs TO anon, authenticated USING (is_active OR public.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Settings are public" ON public.application_settings TO anon, authenticated USING (id = 1 OR public.has_role(auth.uid(), 'admin'::public.app_role));
ALTER POLICY "Project files readable when approved" ON storage.objects TO authenticated USING (
  bucket_id IN ('project-images', 'project-pdfs')
  AND auth.uid() IS NOT NULL
  AND (
    (storage.foldername(name))[1] = public.current_student_id()::text
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.is_published AND p.submission_status = 'approved'
        AND (
          p.cover_image_url = 'storage:' || storage.objects.bucket_id || '/' || storage.objects.name
          OR p.document_url = 'storage:' || storage.objects.bucket_id || '/' || storage.objects.name
        )
    )
  )
);