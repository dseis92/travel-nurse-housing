-- Create verification_documents table
create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- References
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Document details
  document_type text not null check (document_type in (
    'nursing_license',
    'government_id',
    'hospital_badge',
    'property_deed',
    'background_check',
    'proof_of_ownership',
    'insurance_certificate',
    'other'
  )),

  -- Storage
  file_url text not null,
  file_name text,
  file_size integer,
  file_type text,

  -- Verification status
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),

  -- Review details
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  rejection_reason text,
  reviewer_notes text,

  -- Expiration (for licenses/certifications)
  expires_at timestamptz,
  is_expired boolean generated always as (expires_at is not null and expires_at < now()) stored,

  -- Metadata
  metadata jsonb default '{}'::jsonb
);

-- Create indexes
create index verification_documents_user_id_idx on public.verification_documents(user_id);
create index verification_documents_document_type_idx on public.verification_documents(document_type);
create index verification_documents_status_idx on public.verification_documents(status);
create index verification_documents_expires_at_idx on public.verification_documents(expires_at)
  where expires_at is not null;

-- Enable Row Level Security
alter table public.verification_documents enable row level security;

-- Policies for verification_documents

-- Users can view their own documents
create policy "Users can view own verification documents"
  on public.verification_documents
  for select
  using (auth.uid() = user_id);

-- Users can upload their own documents
create policy "Users can upload verification documents"
  on public.verification_documents
  for insert
  with check (auth.uid() = user_id and status = 'pending');

-- Users can update their own pending documents (re-upload)
create policy "Users can update own pending documents"
  on public.verification_documents
  for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id);

-- Users can delete their own pending documents
create policy "Users can delete own pending documents"
  on public.verification_documents
  for delete
  using (auth.uid() = user_id and status = 'pending');

-- Admins can view all documents (add admin check later)
-- create policy "Admins can view all documents"
--   on public.verification_documents
--   for select
--   using (is_admin(auth.uid()));

-- Admins can update documents for review (add admin check later)
-- create policy "Admins can review documents"
--   on public.verification_documents
--   for update
--   using (is_admin(auth.uid()));

-- Trigger to update updated_at
create trigger handle_verification_documents_updated_at
  before update on public.verification_documents
  for each row
  execute function public.handle_updated_at();

-- Function to update user verification status based on documents
create or replace function public.update_user_verification_status()
returns trigger as $$
declare
  v_user_role text;
  v_has_approved_license boolean;
  v_has_approved_id boolean;
begin
  -- Get user role from profiles
  select role into v_user_role
  from public.profiles
  where id = new.user_id;

  if v_user_role = 'nurse' then
    -- Check if nurse has approved nursing license
    select exists(
      select 1
      from public.verification_documents
      where user_id = new.user_id
        and document_type = 'nursing_license'
        and status = 'approved'
        and (expires_at is null or expires_at > now())
    ) into v_has_approved_license;

    -- Update profile license status
    if v_has_approved_license then
      update public.profiles
      set license_status = 'verified'
      where id = new.user_id;
    elsif new.status = 'rejected' and new.document_type = 'nursing_license' then
      update public.profiles
      set license_status = 'rejected'
      where id = new.user_id;
    elsif new.status = 'pending' and new.document_type = 'nursing_license' then
      update public.profiles
      set license_status = 'pending'
      where id = new.user_id;
    end if;
  elsif v_user_role = 'host' then
    -- Check if host has approved documents
    select exists(
      select 1
      from public.verification_documents
      where user_id = new.user_id
        and document_type in ('government_id', 'property_deed', 'proof_of_ownership')
        and status = 'approved'
    ) into v_has_approved_id;

    -- Update profile host verification status
    if v_has_approved_id then
      update public.profiles
      set host_verification_status = 'verified'
      where id = new.user_id;
    elsif new.status = 'rejected' then
      update public.profiles
      set host_verification_status = 'rejected'
      where id = new.user_id;
    elsif new.status = 'pending' then
      update public.profiles
      set host_verification_status = 'pending'
      where id = new.user_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update verification status
create trigger update_user_verification_status_trigger
  after insert or update of status on public.verification_documents
  for each row
  execute function public.update_user_verification_status();

-- Storage bucket for verification documents (if not already exists)
insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do nothing;

-- Storage policies for verification documents

-- Users can upload verification docs to their own folder
create policy "Users can upload verification documents"
  on storage.objects for insert
  with check (
    bucket_id = 'verification-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own verification docs
create policy "Users can view own verification documents"
  on storage.objects for select
  using (
    bucket_id = 'verification-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own pending verification docs
create policy "Users can delete own verification documents"
  on storage.objects for delete
  using (
    bucket_id = 'verification-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all verification docs (add admin check later)
-- create policy "Admins can view all verification documents"
--   on storage.objects for select
--   using (
--     bucket_id = 'verification-docs'
--     and is_admin(auth.uid())
--   );

-- View for user verification summary
create or replace view public.user_verification_summary as
select
  u.id as user_id,
  u.email,
  p.name,
  p.role,
  p.license_status as nurse_license_status,
  p.host_verification_status,
  count(vd.id) filter (where vd.status = 'pending') as pending_documents,
  count(vd.id) filter (where vd.status = 'approved') as approved_documents,
  count(vd.id) filter (where vd.status = 'rejected') as rejected_documents,
  max(vd.created_at) filter (where vd.status = 'pending') as latest_submission,
  array_agg(
    distinct vd.document_type
  ) filter (where vd.status = 'approved') as approved_document_types
from auth.users u
left join public.profiles p on p.id = u.id
left join public.verification_documents vd on vd.user_id = u.id
group by u.id, u.email, p.name, p.role, p.license_status, p.host_verification_status;

-- Grant access to the view
grant select on public.user_verification_summary to authenticated;

-- Function to check if user is verified
create or replace function public.is_user_verified(p_user_id uuid)
returns boolean as $$
declare
  v_user_role text;
  v_is_verified boolean;
begin
  -- Get user role
  select role into v_user_role
  from public.profiles
  where id = p_user_id;

  if v_user_role = 'nurse' then
    -- Check nurse license verification
    select license_status = 'verified' into v_is_verified
    from public.profiles
    where id = p_user_id;
  elsif v_user_role = 'host' then
    -- Check host verification
    select host_verification_status = 'verified' into v_is_verified
    from public.profiles
    where id = p_user_id;
  else
    v_is_verified := false;
  end if;

  return coalesce(v_is_verified, false);
end;
$$ language plpgsql security definer;

-- Function to get verification badge info
create or replace function public.get_verification_badge(p_user_id uuid)
returns table(
  is_verified boolean,
  badge_type text,
  badge_label text,
  verified_since timestamptz
) as $$
declare
  v_user_role text;
  v_license_status text;
  v_host_status text;
  v_verified_date timestamptz;
begin
  -- Get user info
  select role, license_status, host_verification_status
  into v_user_role, v_license_status, v_host_status
  from public.profiles
  where id = p_user_id;

  if v_user_role = 'nurse' and v_license_status = 'verified' then
    -- Get verification date from first approved nursing license
    select min(reviewed_at) into v_verified_date
    from public.verification_documents
    where user_id = p_user_id
      and document_type = 'nursing_license'
      and status = 'approved';

    return query select
      true as is_verified,
      'nurse'::text as badge_type,
      'Verified Nurse'::text as badge_label,
      v_verified_date as verified_since;

  elsif v_user_role = 'host' and v_host_status = 'verified' then
    -- Get verification date from first approved host document
    select min(reviewed_at) into v_verified_date
    from public.verification_documents
    where user_id = p_user_id
      and document_type in ('government_id', 'property_deed', 'proof_of_ownership')
      and status = 'approved';

    return query select
      true as is_verified,
      'host'::text as badge_type,
      'Verified Host'::text as badge_label,
      v_verified_date as verified_since;

  else
    return query select
      false as is_verified,
      null::text as badge_type,
      null::text as badge_label,
      null::timestamptz as verified_since;
  end if;
end;
$$ language plpgsql security definer;
