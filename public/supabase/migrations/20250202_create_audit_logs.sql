-- Create audit logs table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  username text,
  user_email text,
  action text not null,
  entity_type text,
  entity_id text,
  details text,
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,
  severity text default 'info' check (severity in ('info', 'warning', 'error', 'critical')),
  created_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_entity_type on public.audit_logs(entity_type);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Policy: Admins can view all audit logs
create policy "Admins can view all audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid()
      and user_roles.role = 'ADMIN'
    )
  );

-- Policy: System can insert audit logs
create policy "Authenticated users can insert own audit logs"
  on public.audit_logs
  for insert
  to authenticated
  with check (user_id = auth.uid() or auth.uid() is not null);

-- Function to log audit events
create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_details text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_severity text default 'info'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_log_id uuid;
  v_user_profile record;
begin
  -- Get user profile info
  select full_name as username, id::text as email into v_user_profile
  from public.profiles
  where id = auth.uid();

  -- Insert audit log
  insert into public.audit_logs (
    user_id,
    username,
    user_email,
    action,
    entity_type,
    entity_id,
    details,
    metadata,
    severity
  ) values (
    auth.uid(),
    coalesce(v_user_profile.username, 'unknown'),
    coalesce(v_user_profile.email, auth.email()),
    p_action,
    p_entity_type,
    p_entity_id,
    p_details,
    p_metadata,
    p_severity
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

-- Grant execute permission on the function
grant execute on function public.log_audit_event to authenticated;

comment on table public.audit_logs is 'Stores audit trail of user actions throughout the system';
comment on function public.log_audit_event is 'Function to log audit events with automatic user context';
