-- Create navigation_settings table
create table if not exists public.navigation_settings (
  id uuid primary key default gen_random_uuid(),
  nav_key text unique not null,
  label text not null,
  is_visible boolean default true,
  display_order int not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.navigation_settings enable row level security;

-- Policy: Anyone can read navigation settings
create policy "Anyone can view navigation settings"
  on public.navigation_settings
  for select
  to public
  using (true);

-- Policy: Marketing users can update navigation settings
create policy "Marketing users can update navigation settings"
  on public.navigation_settings
  for update
  to authenticated
  using (public.has_role(auth.uid(), 'MARKETING'))
  with check (public.has_role(auth.uid(), 'MARKETING'));

-- Policy: Marketing users can insert navigation settings
create policy "Marketing users can insert navigation settings"
  on public.navigation_settings
  for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'MARKETING'));

-- Insert default navigation items
insert into public.navigation_settings (nav_key, label, is_visible, display_order) values
  ('home', 'Home', true, 1),
  ('announcements', 'Announcements', true, 2),
  ('about', 'About', true, 3),
  ('camps', 'Camps', true, 4),
  ('experiences', 'Experiences', true, 5),
  ('schools', 'Schools', true, 6),
  ('groups', 'Group Activities', true, 7),
  ('gallery', 'Gallery', true, 8),
  ('contact', 'Contact', true, 9),
  ('schedules', 'Download Schedules', true, 10)
on conflict (nav_key) do nothing;

-- Create updated_at trigger
create or replace function public.update_navigation_settings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger navigation_settings_updated_at
  before update on public.navigation_settings
  for each row
  execute function public.update_navigation_settings_updated_at();
