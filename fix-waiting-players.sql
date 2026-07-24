CREATE OR REPLACE FUNCTION public.get_waiting_players()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'display_name', p.display_name,
      'avatar', p.avatar
    )) FROM (
      SELECT display_name, avatar FROM public.profiles
      WHERE account_type = 'player'
      ORDER BY created_at DESC
      LIMIT 12
    ) p),
    '[]'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_waiting_players TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
