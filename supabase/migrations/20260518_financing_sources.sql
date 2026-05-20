-- Financing sources and amortization schedules for LaunchPilot.

create table if not exists public.financing_sources (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null,
  name text not null,
  amount numeric(12,2) not null default 0,
  duration_months integer not null default 0,
  annual_rate numeric(6,3) not null default 0,
  monthly_payment numeric(12,2) not null default 0,
  grace_period_months integer not null default 0,
  payment_frequency text not null default 'monthly',
  guarantees text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.loan_amortization_schedule (
  id uuid primary key default uuid_generate_v4(),
  financing_source_id uuid not null references public.financing_sources(id) on delete cascade,
  period_number integer not null,
  payment_date date,
  opening_balance numeric(12,2) not null default 0,
  payment_amount numeric(12,2) not null default 0,
  principal_amount numeric(12,2) not null default 0,
  interest_amount numeric(12,2) not null default 0,
  closing_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.financing_sources enable row level security;
alter table public.loan_amortization_schedule enable row level security;

create policy "Project owners can manage financing sources"
on public.financing_sources for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage loan amortization schedules"
on public.loan_amortization_schedule for all
using (exists (
  select 1 from public.financing_sources fs
  join public.projects p on p.id = fs.project_id
  where fs.id = financing_source_id and (p.user_id = auth.uid() or public.is_super_admin())
))
with check (exists (
  select 1 from public.financing_sources fs
  join public.projects p on p.id = fs.project_id
  where fs.id = financing_source_id and (p.user_id = auth.uid() or public.is_super_admin())
));

create index if not exists financing_sources_project_idx on public.financing_sources(project_id);
create index if not exists loan_amortization_schedule_source_idx on public.loan_amortization_schedule(financing_source_id, period_number);

grant select, insert, update, delete on table public.financing_sources to authenticated;
grant select, insert, update, delete on table public.loan_amortization_schedule to authenticated;
grant select, insert, update, delete on table public.financing_sources to service_role;
grant select, insert, update, delete on table public.loan_amortization_schedule to service_role;
