ALTER TABLE public.graduation_messages ADD COLUMN IF NOT EXISTS caption text;

CREATE OR REPLACE FUNCTION public.ensure_my_student()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid; _email text; _meta jsonb; _hub uuid; _dept uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'NOT_AUTHENTICATED'; END IF;
  SELECT id INTO _id FROM public.students WHERE auth_user_id = _uid;
  IF _id IS NOT NULL THEN
    UPDATE public.students SET is_active = true WHERE id = _id AND NOT is_active;
    RETURN _id;
  END IF;
  SELECT email, raw_user_meta_data INTO _email, _meta FROM auth.users WHERE id = _uid;
  UPDATE public.students SET auth_user_id = _uid WHERE lower(email) = lower(_email) AND auth_user_id IS NULL RETURNING id INTO _id;
  IF _id IS NOT NULL THEN RETURN _id; END IF;
  BEGIN _hub := NULLIF(_meta->>'hub_id','')::uuid; EXCEPTION WHEN others THEN _hub := NULL; END;
  BEGIN _dept := NULLIF(_meta->>'department_id','')::uuid; EXCEPTION WHEN others THEN _dept := NULL; END;
  IF NOT EXISTS (SELECT 1 FROM public.hubs WHERE id = _hub) THEN _hub := NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.departments WHERE id = _dept) THEN _dept := NULL; END IF;
  INSERT INTO public.students(auth_user_id, full_name, email, hub_id, department_id, account_status, is_active)
  VALUES (_uid, left(coalesce(nullif(trim(_meta->>'full_name'),''), nullif(trim(_meta->>'name'),''), split_part(_email,'@',1)),120),
          lower(coalesce(_email, _uid::text || '@account.local')), _hub, _dept, 'active', true)
  RETURNING id INTO _id;
  RETURN _id;
END; $$;
REVOKE ALL ON FUNCTION public.ensure_my_student() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_student() TO authenticated;

CREATE OR REPLACE FUNCTION public.guard_message_spam()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  NEW.message := trim(coalesce(NEW.message,''));
  IF EXISTS (SELECT 1 FROM public.graduation_messages
             WHERE student_id = NEW.student_id AND created_at > now() - interval '15 seconds') THEN
    RAISE EXCEPTION 'RATE_LIMIT' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END; $function$;