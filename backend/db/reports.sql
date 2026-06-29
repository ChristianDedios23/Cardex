-- Reports table for the Cardex contact page (matches production schema).
-- The backend writes via the service role, so RLS policies below are optional
-- if all contact traffic goes through /v1/reports.

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),

  user_id uuid references auth.users (id) on delete set null,

  title varchar(160) not null check (char_length(trim(title)) > 0),

  category text not null check (category in ('bug', 'feedback', 'other')),

  bug_type text check (bug_type in ('ui_ux', 'data_sync', 'other')),

  description text not null check (char_length(trim(description)) > 0),

  steps_to_reproduce text,

  contact_email text,

  status text not null default 'open' check (
    status in ('open', 'in_progress', 'resolved', 'closed')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bug_type_only_for_bug check (
    category = 'bug' or bug_type is null
  )
);

create index if not exists reports_status_created_at_idx
  on public.reports (status, created_at desc);

create or replace function public.set_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_set_updated_at on public.reports;

create trigger reports_set_updated_at
before update on public.reports
for each row
execute function public.set_reports_updated_at();

alter table public.reports enable row level security;

-- Anyone can submit a report.
create policy "Anyone can submit reports"
on public.reports
for insert
to anon, authenticated
with check (
  (user_id is null and auth.role() = 'anon')
  or (auth.role() = 'authenticated' and (user_id is null or user_id = auth.uid()))
);

-- Public tracker: read title, category, status, description (no email / steps).
create policy "Public can read report tracker fields"
on public.reports
for select
to anon, authenticated
using (true);
