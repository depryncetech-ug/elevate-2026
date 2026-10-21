ALTER POLICY "Headshots are viewable" ON storage.objects TO anon, authenticated USING (
  bucket_id = 'student-headshots'
  AND (
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = public.current_student_id()::text)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.is_active AND s.avatar_url = 'storage:' || storage.objects.bucket_id || '/' || storage.objects.name)
  )
);
ALTER POLICY "Gratitude videos viewable" ON storage.objects TO anon, authenticated USING (
  bucket_id = 'gratitude-videos'
  AND (
    (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = public.current_student_id()::text)
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (SELECT 1 FROM public.graduation_messages m WHERE m.is_approved AND m.video_url = 'storage:' || storage.objects.bucket_id || '/' || storage.objects.name)
  )
);