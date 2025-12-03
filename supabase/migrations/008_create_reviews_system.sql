-- Create reviews table
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- References
  listing_id uuid references public.listings(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete cascade not null,
  reviewer_id uuid references auth.users(id) on delete cascade not null,
  host_id uuid references auth.users(id) on delete cascade not null,

  -- Rating (1-5 stars)
  rating integer not null check (rating >= 1 and rating <= 5),

  -- Category ratings
  cleanliness_rating integer check (cleanliness_rating >= 1 and cleanliness_rating <= 5),
  accuracy_rating integer check (accuracy_rating >= 1 and accuracy_rating <= 5),
  communication_rating integer check (communication_rating >= 1 and communication_rating <= 5),
  location_rating integer check (location_rating >= 1 and location_rating <= 5),
  value_rating integer check (value_rating >= 1 and value_rating <= 5),

  -- Review content
  title text,
  comment text not null check (length(trim(comment)) >= 10),

  -- Structured feedback
  pros text[],
  cons text[],

  -- Would recommend?
  would_recommend boolean default true,

  -- Host response
  host_response text,
  host_responded_at timestamptz,

  -- Moderation
  is_flagged boolean default false,
  flag_reason text,
  is_hidden boolean default false,
  moderation_notes text,

  -- Helpful votes
  helpful_count integer default 0,

  -- Ensure one review per booking
  constraint unique_review_per_booking unique (booking_id)
);

-- Create indexes
create index reviews_listing_id_idx on public.reviews(listing_id);
create index reviews_reviewer_id_idx on public.reviews(reviewer_id);
create index reviews_host_id_idx on public.reviews(host_id);
create index reviews_booking_id_idx on public.reviews(booking_id);
create index reviews_rating_idx on public.reviews(rating);
create index reviews_created_at_idx on public.reviews(created_at desc);
create index reviews_is_hidden_idx on public.reviews(is_hidden)
  where is_hidden = false;

-- Enable Row Level Security
alter table public.reviews enable row level security;

-- Policies for reviews

-- Anyone can view non-hidden reviews for published listings
create policy "Anyone can view public reviews"
  on public.reviews
  for select
  using (
    is_hidden = false
    and exists (
      select 1 from public.listings
      where id = reviews.listing_id
        and is_published = true
        and is_active = true
    )
  );

-- Reviewers can view their own reviews
create policy "Reviewers can view own reviews"
  on public.reviews
  for select
  using (auth.uid() = reviewer_id);

-- Hosts can view reviews for their listings
create policy "Hosts can view reviews for their listings"
  on public.reviews
  for select
  using (auth.uid() = host_id);

-- Nurses can create reviews for their completed bookings
create policy "Nurses can create reviews for completed bookings"
  on public.reviews
  for insert
  with check (
    auth.uid() = reviewer_id
    and exists (
      select 1 from public.bookings
      where id = reviews.booking_id
        and nurse_id = auth.uid()
        and status = 'completed'
        and end_date < current_date
    )
  );

-- Reviewers can update their own reviews (within 7 days)
create policy "Reviewers can update own reviews within 7 days"
  on public.reviews
  for update
  using (
    auth.uid() = reviewer_id
    and created_at > now() - interval '7 days'
  )
  with check (auth.uid() = reviewer_id);

-- Hosts can update their reviews (to add responses)
create policy "Hosts can respond to reviews"
  on public.reviews
  for update
  using (auth.uid() = host_id)
  with check (auth.uid() = host_id);

-- Trigger to update updated_at
create trigger handle_reviews_updated_at
  before update on public.reviews
  for each row
  execute function public.handle_updated_at();

-- Create helpful_votes table for tracking who found reviews helpful
create table public.review_helpful_votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  review_id uuid references public.reviews(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,

  -- Ensure one vote per user per review
  constraint unique_helpful_vote unique (review_id, user_id)
);

-- Enable RLS
alter table public.review_helpful_votes enable row level security;

-- Policies for helpful votes
create policy "Anyone can view helpful votes"
  on public.review_helpful_votes
  for select
  using (true);

create policy "Users can add helpful votes"
  on public.review_helpful_votes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can remove their helpful votes"
  on public.review_helpful_votes
  for delete
  using (auth.uid() = user_id);

-- Function to update helpful_count when votes change
create or replace function public.update_review_helpful_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.reviews
    set helpful_count = helpful_count + 1
    where id = new.review_id;
  elsif TG_OP = 'DELETE' then
    update public.reviews
    set helpful_count = helpful_count - 1
    where id = old.review_id;
  end if;
  return null;
end;
$$ language plpgsql;

-- Trigger to update helpful count
create trigger update_review_helpful_count_trigger
  after insert or delete on public.review_helpful_votes
  for each row
  execute function public.update_review_helpful_count();

-- Function to update listing ratings when review is added/updated/deleted
create or replace function public.update_listing_ratings()
returns trigger as $$
declare
  v_listing_id uuid;
  v_avg_rating numeric;
  v_review_count integer;
begin
  -- Determine listing_id
  if TG_OP = 'DELETE' then
    v_listing_id := old.listing_id;
  else
    v_listing_id := new.listing_id;
  end if;

  -- Calculate new average rating and count
  select
    round(avg(rating)::numeric, 2),
    count(*)
  into v_avg_rating, v_review_count
  from public.reviews
  where listing_id = v_listing_id
    and is_hidden = false;

  -- Update listing
  update public.listings
  set
    rating = v_avg_rating,
    review_count = v_review_count
  where id = v_listing_id;

  return null;
end;
$$ language plpgsql;

-- Trigger to update listing ratings
create trigger update_listing_ratings_trigger
  after insert or update or delete on public.reviews
  for each row
  execute function public.update_listing_ratings();

-- View for detailed review information
create or replace view public.review_details as
select
  r.id,
  r.created_at,
  r.updated_at,
  r.listing_id,
  r.booking_id,
  r.reviewer_id,
  r.host_id,
  r.rating,
  r.cleanliness_rating,
  r.accuracy_rating,
  r.communication_rating,
  r.location_rating,
  r.value_rating,
  r.title,
  r.comment,
  r.pros,
  r.cons,
  r.would_recommend,
  r.host_response,
  r.host_responded_at,
  r.helpful_count,
  r.is_hidden,
  -- Reviewer info
  rp.name as reviewer_name,
  rp.avatar_url as reviewer_avatar,
  rp.license_status as reviewer_verified,
  -- Listing info
  l.title as listing_title,
  l.city as listing_city,
  l.state as listing_state,
  -- Host info
  hp.name as host_name,
  -- Booking info
  b.start_date as booking_start_date,
  b.end_date as booking_end_date
from public.reviews r
left join public.profiles rp on rp.id = r.reviewer_id
left join public.listings l on l.id = r.listing_id
left join public.profiles hp on hp.id = r.host_id
left join public.bookings b on b.id = r.booking_id;

-- Grant access to the view
grant select on public.review_details to authenticated;

-- Function to get listing rating breakdown
create or replace function public.get_listing_rating_breakdown(p_listing_id uuid)
returns table(
  overall_rating numeric,
  review_count bigint,
  cleanliness_avg numeric,
  accuracy_avg numeric,
  communication_avg numeric,
  location_avg numeric,
  value_avg numeric,
  five_star_count bigint,
  four_star_count bigint,
  three_star_count bigint,
  two_star_count bigint,
  one_star_count bigint,
  recommend_percentage numeric
) as $$
begin
  return query
  select
    round(avg(r.rating)::numeric, 2) as overall_rating,
    count(*)::bigint as review_count,
    round(avg(r.cleanliness_rating)::numeric, 2) as cleanliness_avg,
    round(avg(r.accuracy_rating)::numeric, 2) as accuracy_avg,
    round(avg(r.communication_rating)::numeric, 2) as communication_avg,
    round(avg(r.location_rating)::numeric, 2) as location_avg,
    round(avg(r.value_rating)::numeric, 2) as value_avg,
    count(*) filter (where r.rating = 5)::bigint as five_star_count,
    count(*) filter (where r.rating = 4)::bigint as four_star_count,
    count(*) filter (where r.rating = 3)::bigint as three_star_count,
    count(*) filter (where r.rating = 2)::bigint as two_star_count,
    count(*) filter (where r.rating = 1)::bigint as one_star_count,
    round((count(*) filter (where r.would_recommend = true)::numeric / nullif(count(*), 0)::numeric) * 100, 1) as recommend_percentage
  from public.reviews r
  where r.listing_id = p_listing_id
    and r.is_hidden = false;
end;
$$ language plpgsql;

-- Function to check if user can review a booking
create or replace function public.can_user_review_booking(
  p_booking_id uuid,
  p_user_id uuid
)
returns boolean as $$
declare
  v_can_review boolean;
begin
  select exists(
    select 1
    from public.bookings b
    where b.id = p_booking_id
      and b.nurse_id = p_user_id
      and b.status = 'completed'
      and b.end_date < current_date
      and not exists (
        select 1
        from public.reviews r
        where r.booking_id = b.id
      )
  ) into v_can_review;

  return v_can_review;
end;
$$ language plpgsql security definer;
