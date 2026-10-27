-- Agency-only area: who may read the analyses, and the read function it uses.
-- Authentication alone (any magic link) is not enough: access is granted by the
-- e-mail allowlist below, checked inside the database on every call.
create table public.agency_admins (
  email text primary key check (email = lower(email) and email like '%_@_%'),
  created_at timestamptz not null default now()
);

alter table public.agency_admins enable row level security;

-- Nobody reads or changes the list through the API; the project owner manages
-- it from the dashboard / SQL editor (service role).
revoke all on table public.agency_admins from public, anon, authenticated;
grant select, insert, delete on table public.agency_admins to service_role;

create or replace function public.is_agency_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.agency_admins as admin
    where admin.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_agency_admin() from public, anon;
grant execute on function public.is_agency_admin() to authenticated;

-- One row per saved diagnostic, with the quote interest signals of its report.
-- No personal data exists in these tables: only the analyzed domain, the scores
-- and the anonymous interest events.
create or replace function public.admin_list_analyses(limit_rows integer default 100)
returns table (
  id uuid,
  domain text,
  created_at timestamptz,
  mobile_score integer,
  desktop_score integer,
  quote_opened bigint,
  quote_submitted bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_agency_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  return query
  select
    saved.id,
    saved.report -> 'geo' ->> 'domain',
    saved.created_at,
    case when jsonb_typeof(saved.report #> '{summary,mobile,scores,performance}') = 'number'
      then (saved.report #>> '{summary,mobile,scores,performance}')::numeric::integer end,
    case when jsonb_typeof(saved.report #> '{summary,desktop,scores,performance}') = 'number'
      then (saved.report #>> '{summary,desktop,scores,performance}')::numeric::integer end,
    (select count(*) from public.quote_interest_events as event
       where event.report_id = saved.id and event.event_type = 'dialog_opened'),
    (select count(*) from public.quote_interest_events as event
       where event.report_id = saved.id and event.event_type = 'request_submitted')
  from public.diagnostic_reports as saved
  order by saved.created_at desc
  limit least(greatest(coalesce(limit_rows, 100), 1), 500);
end;
$$;

revoke all on function public.admin_list_analyses(integer) from public, anon;
grant execute on function public.admin_list_analyses(integer) to authenticated;
