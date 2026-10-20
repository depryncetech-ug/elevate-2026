GRANT SELECT (id, student_id, message, is_approved, created_at, updated_at, video_url, caption) ON public.graduation_messages TO anon, authenticated;
GRANT INSERT (student_id, message, video_url, caption) ON public.graduation_messages TO authenticated;
GRANT UPDATE (is_approved) ON public.graduation_messages TO authenticated;
GRANT DELETE ON public.graduation_messages TO authenticated;
GRANT ALL ON public.graduation_messages TO service_role;