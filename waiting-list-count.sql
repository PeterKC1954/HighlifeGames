CREATE OR REPLACE FUNCTION public.get_waiting_list_count()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO public, extensions
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.waiting_list;
  RETURN jsonb_build_object('count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_waiting_list_count TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
