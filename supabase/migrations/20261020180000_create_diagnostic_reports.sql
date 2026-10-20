create table public.diagnostic_reports (
  id uuid primary key default gen_random_uuid(),
  report jsonb not null check (jsonb_typeof(report) = 'object'),
  created_at timestamptz not null default now()
);

alter table public.diagnostic_reports enable row level security;

revoke all on table public.diagnostic_reports from public, anon, authenticated;
grant insert, select on table public.diagnostic_reports to service_role;

create or replace function public.get_public_diagnostic_report(report_id uuid)
returns table (id uuid, report jsonb, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select saved.id, saved.report, saved.created_at
  from public.diagnostic_reports as saved
  where saved.id = report_id
  limit 1;
$$;

revoke all on function public.get_public_diagnostic_report(uuid) from public;
grant execute on function public.get_public_diagnostic_report(uuid)
  to anon, authenticated;
