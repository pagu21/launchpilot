-- Align Launch Pilot with the operational model used by the app.
-- Adds seasonal seating capacity, editable cost items, seasonal staff fields,
-- editable revenue scenario assumptions, and workflow confirmation tables.

do $$ begin
  create type public.cost_kind as enum ('fixed', 'variable', 'one_time');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.cost_area as enum ('staff', 'food', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.workflow_step_status as enum ('draft', 'confirmed');
exception when duplicate_object then null;
end $$;

alter table public.projects
  add column if not exists opening_days_annual integer not null default 310,
  add column if not exists lunch_enabled boolean not null default true,
  add column if not exists dinner_enabled boolean not null default true,
  add column if not exists default_occupancy_pct numeric(6,3) not null default 70,
  add column if not exists updated_at timestamptz not null default now();

alter table public.staff
  add column if not exists seasonal boolean not null default false,
  add column if not exists season_start_month integer,
  add column if not exists season_end_month integer,
  add column if not exists months_per_year numeric(5,2) not null default 12,
  add column if not exists service_shift text,
  add column if not exists notes text;

alter table public.scenarios
  add column if not exists scenario_key text,
  add column if not exists label text,
  add column if not exists tone text,
  add column if not exists opening_days_annual integer not null default 310,
  add column if not exists seats integer not null default 40,
  add column if not exists lunch_enabled boolean not null default true,
  add column if not exists dinner_enabled boolean not null default true,
  add column if not exists capacity_covers_annual numeric(12,2) not null default 0,
  add column if not exists customers_annual numeric(12,2) not null default 0,
  add column if not exists customers_daily numeric(12,2) not null default 0,
  add column if not exists other_variable_pct numeric(6,3) not null default 0,
  add column if not exists personnel_annual numeric(12,2) not null default 0,
  add column if not exists other_fixed_annual numeric(12,2) not null default 0,
  add column if not exists variable_costs numeric(12,2) not null default 0,
  add column if not exists fixed_costs numeric(12,2) not null default 0,
  add column if not exists ebitda numeric(12,2) not null default 0,
  add column if not exists ebit numeric(12,2) not null default 0,
  add column if not exists cash_after_debt numeric(12,2) not null default 0;

create table if not exists public.seating_capacity_periods (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  start_month integer not null check (start_month between 1 and 12),
  end_month integer not null check (end_month between 1 and 12),
  opening_days integer not null default 0,
  seats integer not null default 0,
  lunch_enabled boolean not null default true,
  dinner_enabled boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.cost_items (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  area public.cost_area not null default 'other',
  kind public.cost_kind not null default 'fixed',
  category text not null,
  name text not null,
  monthly_amount numeric(12,2) not null default 0,
  annual_amount numeric(12,2) not null default 0,
  incidence_pct numeric(6,3) not null default 0,
  vat_rate numeric(5,2) not null default 22,
  vat_included boolean not null default true,
  editable boolean not null default true,
  source_step_index integer,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workflow_steps (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  step_index integer not null,
  name text not null,
  status public.workflow_step_status not null default 'draft',
  confirmed_at timestamptz,
  confirmed_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(project_id, step_index)
);

create table if not exists public.workflow_cost_items (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  step_index integer not null,
  label text not null,
  category text not null,
  amount numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 22,
  vat_included boolean not null default true,
  enabled boolean not null default true,
  custom boolean not null default false,
  kind public.cost_kind not null default 'fixed',
  confirmed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.seating_capacity_periods enable row level security;
alter table public.cost_items enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.workflow_cost_items enable row level security;

drop policy if exists "Project owners can manage seating capacity periods" on public.seating_capacity_periods;
create policy "Project owners can manage seating capacity periods"
on public.seating_capacity_periods for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

drop policy if exists "Project owners can manage cost items" on public.cost_items;
create policy "Project owners can manage cost items"
on public.cost_items for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

drop policy if exists "Project owners can manage workflow steps" on public.workflow_steps;
create policy "Project owners can manage workflow steps"
on public.workflow_steps for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

drop policy if exists "Project owners can manage workflow cost items" on public.workflow_cost_items;
create policy "Project owners can manage workflow cost items"
on public.workflow_cost_items for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create index if not exists seating_capacity_periods_project_idx on public.seating_capacity_periods(project_id);
create index if not exists cost_items_project_area_idx on public.cost_items(project_id, area);
create index if not exists workflow_steps_project_idx on public.workflow_steps(project_id, step_index);
create index if not exists workflow_cost_items_project_step_idx on public.workflow_cost_items(project_id, step_index);
