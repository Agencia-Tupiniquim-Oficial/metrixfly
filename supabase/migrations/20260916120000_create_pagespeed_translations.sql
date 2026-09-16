-- supabase/migrations/20260916120000_create_pagespeed_translations.sql
create table if not exists pagespeed_translations (
  audit_id text primary key,
  translated_description text not null,
  updated_at timestamptz default now()
);