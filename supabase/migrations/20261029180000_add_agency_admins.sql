-- More agency accounts for the admin area. Each e-mail must also exist in
-- Supabase Auth (Authentication > Users): sign-ups are not created by the app.
insert into public.agency_admins (email)
values
  ('suporte@agenciatupiniquim.com.br'),
  ('ferramentas@agenciatupiniquim.com.br')
on conflict (email) do nothing;
