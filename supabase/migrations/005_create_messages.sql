-- Create message threads table
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- References
  listing_id uuid references public.listings(id) on delete set null,

  -- Participants (array of user IDs)
  participant_ids uuid[] not null,

  -- Metadata
  archived_by uuid[] default array[]::uuid[],

  -- Check that there are at least 2 participants
  constraint valid_participants check (array_length(participant_ids, 1) >= 2)
);

-- Create messages table
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- References
  thread_id uuid references public.message_threads(id) on delete cascade not null,
  sender_id uuid references auth.users(id) on delete cascade not null,

  -- Message content
  body text not null,

  -- Optional attachments (array of storage URLs)
  attachments text[],

  -- System messages (like booking notifications)
  is_system boolean default false,

  -- Read receipts
  read_by uuid[] default array[]::uuid[],

  -- Soft delete
  deleted_at timestamptz,

  -- Check body is not empty
  constraint valid_body check (length(trim(body)) > 0)
);

-- Create indexes for common queries
create index message_threads_participant_ids_idx on public.message_threads using gin(participant_ids);
create index message_threads_listing_id_idx on public.message_threads(listing_id);
create index message_threads_updated_at_idx on public.message_threads(updated_at desc);

create index messages_thread_id_idx on public.messages(thread_id);
create index messages_sender_id_idx on public.messages(sender_id);
create index messages_created_at_idx on public.messages(created_at);
create index messages_read_by_idx on public.messages using gin(read_by);

-- Enable Row Level Security
alter table public.message_threads enable row level security;
alter table public.messages enable row level security;

-- Policies for message_threads

-- Users can view threads they are part of
create policy "Users can view their message threads"
  on public.message_threads
  for select
  using (auth.uid() = any(participant_ids));

-- Users can create threads they are part of
create policy "Users can create message threads"
  on public.message_threads
  for insert
  with check (auth.uid() = any(participant_ids));

-- Users can update threads they are part of (for archiving)
create policy "Users can update their message threads"
  on public.message_threads
  for update
  using (auth.uid() = any(participant_ids))
  with check (auth.uid() = any(participant_ids));

-- Policies for messages

-- Users can view messages in threads they are part of
create policy "Users can view messages in their threads"
  on public.messages
  for select
  using (
    exists (
      select 1 from public.message_threads
      where id = messages.thread_id
      and auth.uid() = any(participant_ids)
    )
    and deleted_at is null
  );

-- Users can send messages in threads they are part of
create policy "Users can send messages in their threads"
  on public.messages
  for insert
  with check (
    exists (
      select 1 from public.message_threads
      where id = messages.thread_id
      and auth.uid() = any(participant_ids)
    )
    and auth.uid() = sender_id
  );

-- Users can update their own messages (for read receipts, soft delete)
create policy "Users can update their own messages"
  on public.messages
  for update
  using (auth.uid() = sender_id or exists (
    select 1 from public.message_threads
    where id = messages.thread_id
    and auth.uid() = any(participant_ids)
  ))
  with check (auth.uid() = sender_id or exists (
    select 1 from public.message_threads
    where id = messages.thread_id
    and auth.uid() = any(participant_ids)
  ));

-- Trigger to update updated_at on message_threads
create trigger handle_message_threads_updated_at
  before update on public.message_threads
  for each row
  execute function public.handle_updated_at();

-- Trigger to update updated_at on messages
create trigger handle_messages_updated_at
  before update on public.messages
  for each row
  execute function public.handle_updated_at();

-- Function to mark messages as read
create or replace function public.mark_message_as_read(
  p_message_id uuid,
  p_user_id uuid
)
returns void as $$
begin
  update public.messages
  set read_by = array_append(read_by, p_user_id)
  where id = p_message_id
    and not (p_user_id = any(read_by));
end;
$$ language plpgsql security definer;

-- Function to mark all messages in a thread as read
create or replace function public.mark_thread_messages_as_read(
  p_thread_id uuid,
  p_user_id uuid
)
returns void as $$
begin
  update public.messages
  set read_by = array_append(read_by, p_user_id)
  where thread_id = p_thread_id
    and sender_id != p_user_id
    and not (p_user_id = any(read_by))
    and deleted_at is null;
end;
$$ language plpgsql security definer;

-- Function to get unread count for a user
create or replace function public.get_unread_message_count(p_user_id uuid)
returns integer as $$
declare
  v_count integer;
begin
  select count(*)::integer into v_count
  from public.messages m
  join public.message_threads t on t.id = m.thread_id
  where p_user_id = any(t.participant_ids)
    and m.sender_id != p_user_id
    and not (p_user_id = any(m.read_by))
    and m.deleted_at is null;

  return v_count;
end;
$$ language plpgsql security definer;

-- Function to get unread count per thread for a user
create or replace function public.get_thread_unread_counts(p_user_id uuid)
returns table(thread_id uuid, unread_count bigint) as $$
begin
  return query
  select
    m.thread_id,
    count(*)::bigint as unread_count
  from public.messages m
  join public.message_threads t on t.id = m.thread_id
  where p_user_id = any(t.participant_ids)
    and m.sender_id != p_user_id
    and not (p_user_id = any(m.read_by))
    and m.deleted_at is null
  group by m.thread_id;
end;
$$ language plpgsql security definer;

-- View for message threads with last message and unread counts
create or replace view public.message_thread_details as
select
  t.id,
  t.created_at,
  t.updated_at,
  t.listing_id,
  t.participant_ids,
  t.archived_by,
  -- Last message
  (
    select row_to_json(m.*)
    from (
      select id, thread_id, sender_id, body, created_at, attachments, is_system
      from public.messages
      where thread_id = t.id
        and deleted_at is null
      order by created_at desc
      limit 1
    ) m
  ) as last_message,
  -- Listing details
  l.title as listing_title,
  l.city as listing_city,
  l.state as listing_state,
  l.image_url as listing_image_url
from public.message_threads t
left join public.listings l on l.id = t.listing_id;

-- Grant access to the view
grant select on public.message_thread_details to authenticated;

-- Storage bucket for message attachments
insert into storage.buckets (id, name, public)
values ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

-- Storage policies for message attachments
create policy "Users can upload message attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'message-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view message attachments in their threads"
  on storage.objects for select
  using (
    bucket_id = 'message-attachments'
    and exists (
      select 1 from public.messages m
      join public.message_threads t on t.id = m.thread_id
      where auth.uid() = any(t.participant_ids)
        and storage.filename(name) = any(m.attachments)
    )
  );

create policy "Users can delete their own message attachments"
  on storage.objects for delete
  using (
    bucket_id = 'message-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
