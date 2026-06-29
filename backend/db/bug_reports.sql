-- Bug / feedback reports for the Cardex contact page.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).

create sequence if not exists bug_report_display_number_seq start 1;

create table if not exists bug_reports (
  id uuid primary key default gen_random_uuid(),

  display_number bigint not null unique default nextval('bug_report_display_number_seq'),

  user_id uuid references auth.users (id) on delete set null,

  reporter_email text,

  title text not null check (char_length(trim(title)) > 0),

  report_type text not null check (report_type in ('bug', 'feedback', 'other')),

  sub_category text check (
    sub_category is null
    or sub_category in ('ui', 'data', 'other')
  ),

  description text not null check (char_length(trim(description)) > 0),

  steps_to_reproduce text,

  status text not null default 'open' check (
    status in ('open', 'in_progress', 'resolved')
  ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bug_reports_sub_category_for_type check (
    (
      report_type in ('bug', 'feedback')
      and sub_category is not null
    )
    or (
      report_type = 'other'
      and sub_category is null
    )
  )
);

create index if not exists bug_reports_status_created_at_idx
  on bug_reports (status, created_at desc);

create index if not exists bug_reports_user_id_idx
  on bug_reports (user_id);

create or replace function public.set_bug_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bug_reports_set_updated_at on bug_reports;

create trigger bug_reports_set_updated_at
before update on bug_reports
for each row
execute function public.set_bug_reports_updated_at();

alter table bug_reports enable row level security;

-- Public tracker RPC: title, category, status, and description only (no email / steps).
create or replace function public.list_bug_report_tracker(max_rows integer default 50)
returns table (
  id uuid,
  display_number bigint,
  display_id text,
  title text,
  report_type text,
  sub_category text,
  summary text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    bug_reports.id,
    bug_reports.display_number,
    'CARDEX-' || bug_reports.display_number::text,
    bug_reports.title,
    bug_reports.report_type,
    bug_reports.sub_category,
    left(bug_reports.description, 280),
    bug_reports.status,
    bug_reports.created_at
  from bug_reports
  order by bug_reports.created_at desc
  limit greatest(1, least(max_rows, 100));
$$;

grant execute on function public.list_bug_report_tracker(integer) to anon, authenticated;

-- Anonymous users can submit reports without attaching a user_id.
create policy "Anonymous can submit bug reports"
on bug_reports
for insert
to anon
with check (user_id is null);

-- Signed-in users can submit reports for themselves only.
create policy "Authenticated users can submit bug reports"
on bug_reports
for insert
to authenticated
with check (user_id is null or user_id = auth.uid());

-- No public SELECT on the table — use list_bug_report_tracker() instead.

comment on table bug_reports is 'User-submitted bugs, feedback, and contact messages from the Cardex contact page.';
comment on column bug_reports.display_number is 'Sequential number used to build public IDs like CARDEX-12.';
comment on column bug_reports.report_type is 'bug, feedback, or other.';
comment on column bug_reports.sub_category is 'ui, data, or other — required for bug and feedback.';
comment on column bug_reports.status is 'open, in_progress, or resolved.';
