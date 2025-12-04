-- Create profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Basic info
  name text,
  email text,
  phone text,
  bio text,

  -- Role
  role text not null check (role in ('nurse', 'host')) default 'nurse',

  -- Avatar
  avatar_url text,

  -- Nurse-specific fields
  specialties text[],
  preferred_cities text[],
  license_number text,
  license_state text,
  license_status text check (license_status in ('unverified', 'pending', 'verified', 'rejected')) default 'unverified',

  -- Host-specific fields
  host_verification_status text check (host_verification_status in ('unverified', 'pending', 'verified', 'rejected')) default 'unverified',

  -- Privacy settings
  show_email boolean default false,
  show_phone boolean default false,
  allow_messages boolean default true,

  -- Metadata
  onboarding_completed boolean default false,
  last_active_at timestamptz default now(),
  metadata jsonb default '{}'::jsonb
);

-- Create indexes
create index profiles_role_idx on public.profiles(role);
create index profiles_email_idx on public.profiles(email);
create index profiles_license_status_idx on public.profiles(license_status)
  where role = 'nurse';
create index profiles_host_verification_status_idx on public.profiles(host_verification_status)
  where role = 'host';

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies for profiles

-- Anyone can view public profile info
create policy "Anyone can view public profiles"
  on public.profiles
  for select
  using (true);

-- Users can view their own full profile
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Trigger to update updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'nurse')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars

-- Users can upload their own avatar
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view avatars (public bucket)
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- View for safe profile data (excludes sensitive info)
create or replace view public.profile_public as
select
  p.id,
  p.created_at,
  p.name,
  p.role,
  p.avatar_url,
  p.bio,
  case when p.show_email then p.email else null end as email,
  case when p.show_phone then p.phone else null end as phone,
  p.specialties,
  p.license_status,
  p.host_verification_status,
  p.last_active_at
from public.profiles p;

-- Grant access to the view
grant select on public.profile_public to authenticated;
grant select on public.profile_public to anon;

-- Function to update last active timestamp
create or replace function public.update_last_active()
returns void as $$
begin
  update public.profiles
  set last_active_at = now()
  where id = auth.uid();
end;
$$ language plpgsql security definer;
