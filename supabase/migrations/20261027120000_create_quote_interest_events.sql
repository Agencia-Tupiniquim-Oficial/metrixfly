-- Interest signals for the "Solicitar orcamento" button, tied to the analyzed
-- company (domain) and, when available, the saved diagnostic report.
-- No personal data is stored: contact details only travel in the quote email.
create table public.quote_interest_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('dialog_opened', 'request_submitted')),
  session_id uuid not null,
  report_id uuid,
  domain text not null check (char_length(domain) between 1 and 253),
  service_interest text not null default 'general'
    check (service_interest in ('general', 'search_console', 'analytics')),
  created_at timestamptz not null default now(),
  -- One row per browser session, event, company and interest (deduplication).
  unique (session_id, event_type, domain, service_interest)
);

create index quote_interest_events_domain_created_at_idx
  on public.quote_interest_events (domain, created_at desc);
create index quote_interest_events_report_id_idx
  on public.quote_interest_events (report_id)
  where report_id is not null;

alter table public.quote_interest_events enable row level security;

revoke all on table public.quote_interest_events from public, anon, authenticated;
grant insert, select, delete on table public.quote_interest_events to service_role;

-- Retention helper (not scheduled). Default proposal: 12 months, pending the
-- product/legal decision recorded in docs/agents/PLANO.md.
create or replace function public.purge_quote_interest_events(
  retention interval default interval '12 months'
)
returns integer
language sql
security definer
set search_path = ''
as $$
  with removed as (
    delete from public.quote_interest_events
    where created_at < now() - retention
    returning 1
  )
  select count(*)::integer from removed;
$$;

revoke all on function public.purge_quote_interest_events(interval) from public, anon, authenticated;
grant execute on function public.purge_quote_interest_events(interval) to service_role;
