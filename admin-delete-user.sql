-- Admin function to delete a user profile
-- Only admins can delete users, and they cannot delete themselves
-- This deletes the profile row. Auth tokens are also cleaned up.

create or replace function admin_delete_user(p_token text, p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_caller_id uuid;
  v_caller_type text;
begin
  -- Validate the caller's session
  select p.id, p.account_type into v_caller_id, v_caller_type
  from profiles p
  join auth_tokens t on t.user_id = p.id
  where t.token = p_token and t.expires_at > now();

  if not found then
    return jsonb_build_object('error', 'Invalid or expired session');
  end if;

  if v_caller_type != 'admin' then
    return jsonb_build_object('error', 'Admin access required');
  end if;

  -- Prevent self-deletion
  if v_caller_id = p_user_id then
    return jsonb_build_object('error', 'You cannot delete your own account');
  end if;

  -- Delete the user's auth tokens first
  delete from auth_tokens where user_id = p_user_id;

  -- Delete the user's profile
  delete from profiles where id = p_user_id;

  if not found then
    return jsonb_build_object('error', 'User not found');
  end if;

  return jsonb_build_object('success', true);
end;
$$;

-- Grant execute to anon (RLS protects via token validation)
grant execute on function admin_delete_user to anon;
