-- E-mails left by visitors to unlock a finished report. The e-mail is used only to
-- release the report on screen and is shown to the agency in the admin area next to
-- the analyzed site, so the agency can see who analyzed what and how many times.
create table public.report_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null check (
    email = lower(email)
    and length(email) <= 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  domain text not null check (length(domain) between 1 and 253),
  report_id uuid references public.diagnostic_reports (id) on delete set null,
  created_at timestamptz not null default now()
);

create index report_leads_email_idx on public.report_leads (email);
create index report_leads_created_at_idx on public.report_leads (created_at desc);

alter table public.report_leads enable row level security;

-- No direct access through the API: visitors write only through the function below
-- and the agency reads only through the admin function.
revoke all on table public.report_leads from public, anon, authenticated;
grant select, insert, delete on table public.report_leads to service_role;

create or replace function public.submit_report_lead(
  lead_email text,
  lead_domain text,
  lead_report_id uuid default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  clean_email text := lower(btrim(coalesce(lead_email, '')));
  clean_domain text := left(btrim(coalesce(lead_domain, '')), 253);
begin
  if clean_domain = '' then
    raise exception 'invalid_domain' using errcode = '22023';
  end if;

  -- The table check rejects a malformed e-mail; a report id that does not exist
  -- is stored as null instead of failing the unlock.
  insert into public.report_leads (email, domain, report_id)
  values (
    clean_email,
    clean_domain,
    (select saved.id from public.diagnostic_reports as saved where saved.id = lead_report_id)
  );
end;
$$;

revoke all on function public.submit_report_lead(text, text, uuid) from public;
grant execute on function public.submit_report_lead(text, text, uuid) to anon, authenticated;

-- Agency view of the captured e-mails, newest first.
create or replace function public.admin_list_report_leads(limit_rows integer default 500)
returns table (
  id uuid,
  email text,
  domain text,
  report_id uuid,
  created_at timestamptz
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
  select lead.id, lead.email, lead.domain, lead.report_id, lead.created_at
  from public.report_leads as lead
  order by lead.created_at desc
  limit least(greatest(coalesce(limit_rows, 500), 1), 2000);
end;
$$;

revoke all on function public.admin_list_report_leads(integer) from public, anon;
grant execute on function public.admin_list_report_leads(integer) to authenticated;
