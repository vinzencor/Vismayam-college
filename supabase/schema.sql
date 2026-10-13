-- Vismayam College — Supabase schema
-- Run this whole file in the Supabase SQL editor (safe to re-run), then:
--   npm run seed                                      # starter catalogue, testimonials, homepage content
--   npm run create-admin -- you@example.com 'pass'    # login for /vismayam/admin

-- ---------- Helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- ---------- Admins ----------
-- Users listed here can edit content from /vismayam/admin. Add rows with
-- `npm run create-admin` (or insert a user id from Authentication → Users).
create table if not exists public.admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

-- ---------- Categories ----------
create table if not exists public.categories (
  id          text primary key,
  name        text not null,
  blurb       text,
  icon        text,
  featured    boolean not null default false,
  sort_order  int not null default 0
);

-- ---------- Courses ----------
-- Nested content (curriculum, outcomes, instructor) is stored as jsonb so the
-- detail page can be rendered from a single row.
create table if not exists public.courses (
  slug              text primary key,
  title             text not null,
  short_title       text,
  category          text references public.categories (id),
  track_label       text,
  is_career_track   boolean not null default false,
  is_bestseller     boolean not null default false,
  delivery          text,
  level             text check (level in ('beginner', 'intermediate', 'advanced')),
  duration_weeks    int not null,
  commitment        text,
  certificate       text,
  rating            numeric(2, 1),
  review_count      int default 0,
  learners          int default 0,
  price             int not null,
  original_price    int,
  monthly_price     int,
  installments      int default 6,
  start_date        date,
  seats_available   boolean not null default true,
  job_rate          int,
  guarantee_days    int default 7,
  popularity        int not null default 0,
  image             text,
  summary           text,
  mentor_reviews    int default 0,
  capstones         int default 1,
  curriculum        jsonb not null default '[]'::jsonb,  -- [{ title, description, weeks, lessons, topics[] }]
  outcomes_heading  jsonb,                               -- { lead, highlight }
  outcomes_intro    text,
  outcomes          jsonb not null default '[]'::jsonb,  -- [{ icon, title, description }]
  instructor        jsonb,                               -- { name, role, bio, photo, years, learnersMentored, rating }
  syllabus_url      text,                                -- optional PDF; otherwise a text syllabus is generated
  published         boolean not null default true,       -- drafts are only visible to admins
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.courses add column if not exists published boolean not null default true;
alter table public.courses add column if not exists updated_at timestamptz not null default now();

create index if not exists courses_category_idx on public.courses (category);

drop trigger if exists courses_updated_at on public.courses;
create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------- Testimonials (home page "Student outcomes") ----------
create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  role          text,                 -- e.g. "Product Designer at FinEdge · Class of 2025"
  quote         text not null,
  photo         text,                 -- large portrait
  avatar        text,                 -- small round photo next to the name (falls back to photo)
  metric_value  text,                 -- e.g. "+62%"
  metric_label  text,
  sort_order    int not null default 0,
  published     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists testimonials_updated_at on public.testimonials;
create trigger testimonials_updated_at before update on public.testimonials
  for each row execute function public.set_updated_at();

-- ---------- Site settings (homepage images, stats…) ----------
-- One jsonb document per page/section, e.g. id = 'home'.
create table if not exists public.site_settings (
  id          text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------- Enquiries (contact + callback forms) ----------
-- Written only by the `submit-enquiry` Edge Function (service role), which also
-- emails the admissions team. Admins can view them at /vismayam/admin/enquiries.
create table if not exists public.enquiries (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  mobile         text not null,                -- normalised to +91XXXXXXXXXX
  course_slug    text not null,                -- a course slug, or 'not-sure'
  qualification  text not null,
  contact_mode   text not null check (contact_mode in ('whatsapp', 'call')),
  source         text,                         -- which form: home-recommendation | contact-page
  page_url       text,
  email_sent     boolean not null default false,
  email_error    text,                         -- set if the admissions email failed
  contacted      boolean not null default false, -- ticked by the team in the admin
  created_at     timestamptz not null default now()
);

alter table public.enquiries add column if not exists contacted boolean not null default false;

create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);

-- ---------- Row Level Security ----------
alter table public.admins        enable row level security;
alter table public.categories    enable row level security;
alter table public.courses       enable row level security;
alter table public.testimonials  enable row level security;
alter table public.site_settings enable row level security;
alter table public.enquiries     enable row level security;

-- Admins: a signed-in user can only see whether they themselves are an admin.
drop policy if exists "Users can read own admin row" on public.admins;
create policy "Users can read own admin row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Catalogue: public read (published only), admins can do everything.
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select using (true);
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read courses" on public.courses;
create policy "Public can read courses" on public.courses for select using (published or public.is_admin());
drop policy if exists "Admins manage courses" on public.courses;
create policy "Admins manage courses" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read testimonials" on public.testimonials;
create policy "Public can read testimonials" on public.testimonials for select using (published or public.is_admin());
drop policy if exists "Admins manage testimonials" on public.testimonials;
create policy "Admins manage testimonials" on public.testimonials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings" on public.site_settings for select using (true);
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Enquiries: no public access. Submissions go through the Edge Function, which validates input first.
drop policy if exists "Anyone can submit an enquiry" on public.enquiries;
drop policy if exists "Admins read enquiries" on public.enquiries;
create policy "Admins read enquiries" on public.enquiries for select to authenticated using (public.is_admin());
drop policy if exists "Admins update enquiries" on public.enquiries;
create policy "Admins update enquiries" on public.enquiries
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete enquiries" on public.enquiries;
create policy "Admins delete enquiries" on public.enquiries for delete to authenticated using (public.is_admin());

-- Table privileges (RLS above decides which rows).
grant select on public.categories, public.courses, public.testimonials, public.site_settings to anon, authenticated;
grant insert, update, delete on public.categories, public.courses, public.testimonials, public.site_settings to authenticated;
grant select, update, delete on public.enquiries to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Storage: uploaded images + syllabus PDFs ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- The bucket is public, so files are readable by URL; only admins can add or remove them.
-- Storage needs SELECT to find a file before deleting/overwriting it, so admins get that too
-- (visitors don't need it — public URLs bypass policies).
drop policy if exists "Admins read media" on storage.objects;
create policy "Admins read media" on storage.objects
  for select to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "Admins upload media" on storage.objects;
create policy "Admins upload media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "Admins update media" on storage.objects;
create policy "Admins update media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "Admins delete media" on storage.objects;
create policy "Admins delete media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
