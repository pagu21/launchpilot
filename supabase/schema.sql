create extension if not exists "uuid-ossp";

create type public.user_role as enum ('super_admin', 'client');
create type public.subscription_status as enum ('demo', 'active', 'past_due', 'cancelled');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'client',
  subscription_status public.subscription_status not null default 'demo',
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  restaurant_format text,
  city text,
  seats integer not null default 40,
  average_ticket numeric(12,2) not null default 40,
  opening_days integer not null default 26,
  covers_per_day integer not null default 70,
  vat_included boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.investments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 22,
  vat_included boolean not null default true,
  amortizable boolean not null default true,
  useful_life_years integer not null default 5,
  residual_value numeric(12,2) not null default 0
);


create table public.investment_assets (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  description text not null,
  purchase_value numeric(12,2) not null default 0,
  useful_life_years integer not null default 5,
  depreciation_rate numeric(6,3) not null default 20,
  first_year_half boolean not null default true,
  annual_depreciation numeric(12,2) not null default 0,
  residual_value numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create table public.financing (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  financing_type text not null,
  financed_amount numeric(12,2) not null,
  down_payment numeric(12,2) not null default 0,
  duration_months integer not null,
  annual_interest_rate numeric(6,3) not null,
  payment_frequency text not null default 'monthly',
  grace_period_months integer not null default 0,
  start_date date not null default current_date
);


create table public.financing_sources (
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

create table public.loan_amortization_schedule (
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

create table public.staff (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null,
  people numeric(8,2) not null default 1,
  annual_cost numeric(12,2) not null default 0,
  monthly_cost numeric(12,2) not null default 0,
  charges_included boolean not null default true
);

create table public.variable_costs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  monthly_amount numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 22,
  vat_included boolean not null default true,
  preset_source text
);

create table public.purchase_categories (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  incidence_pct numeric(6,3) not null default 0,
  monthly_amount numeric(12,2) not null default 0,
  vat_rate numeric(5,2) not null default 10,
  suggested_value numeric(12,2) not null default 0
);

create table public.kpi_results (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  revenue_monthly numeric(12,2) not null default 0,
  ebitda_monthly numeric(12,2) not null default 0,
  food_cost_pct numeric(6,3) not null default 0,
  beverage_cost_pct numeric(6,3) not null default 0,
  labor_cost_pct numeric(6,3) not null default 0,
  break_even_covers numeric(12,2) not null default 0,
  dscr numeric(8,3) not null default 0,
  score integer not null default 0,
  sustainability text not null default 'yellow',
  calculated_at timestamptz not null default now()
);

create table public.scenarios (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  average_ticket numeric(12,2) not null,
  food_cost_pct numeric(6,3) not null,
  occupancy_pct numeric(6,3) not null,
  revenue numeric(12,2) not null default 0,
  margin numeric(12,2) not null default 0
);

create table public.cashflow (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  month_index integer not null,
  initial_cash numeric(12,2) not null default 0,
  investment_outflows numeric(12,2) not null default 0,
  financing_payments numeric(12,2) not null default 0,
  estimated_taxes numeric(12,2) not null default 0,
  vat_balance numeric(12,2) not null default 0,
  working_capital numeric(12,2) not null default 0,
  operating_cashflow numeric(12,2) not null default 0,
  net_cashflow numeric(12,2) not null default 0,
  closing_cash numeric(12,2) not null default 0
);

create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  storage_path text,
  generated_at timestamptz not null default now()
);



alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.investments enable row level security;
alter table public.investment_assets enable row level security;
alter table public.financing enable row level security;
alter table public.financing_sources enable row level security;
alter table public.loan_amortization_schedule enable row level security;
alter table public.staff enable row level security;
alter table public.variable_costs enable row level security;
alter table public.purchase_categories enable row level security;
alter table public.kpi_results enable row level security;
alter table public.scenarios enable row level security;
alter table public.cashflow enable row level security;
alter table public.reports enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create policy "Users can read own profile"
on public.users for select
using (id = auth.uid() or public.is_super_admin());

create policy "Users can update own profile"
on public.users for update
using (id = auth.uid() or public.is_super_admin());

create policy "Project owners can manage projects"
on public.projects for all
using (user_id = auth.uid() or public.is_super_admin())
with check (user_id = auth.uid() or public.is_super_admin());

create policy "Project owners can manage investments"
on public.investments for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));


create policy "Project owners can manage investment assets"
on public.investment_assets for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage financing"
on public.financing for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));


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

create policy "Project owners can manage staff"
on public.staff for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage variable costs"
on public.variable_costs for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage purchase categories"
on public.purchase_categories for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage kpis"
on public.kpi_results for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage scenarios"
on public.scenarios for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage cashflow"
on public.cashflow for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage reports"
on public.reports for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));


-- Product alignment: operational scenarios, editable costs, workflow confirmations, seasonal capacity.
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

create policy "Project owners can manage seating capacity periods"
on public.seating_capacity_periods for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage cost items"
on public.cost_items for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage workflow steps"
on public.workflow_steps for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create policy "Project owners can manage workflow cost items"
on public.workflow_cost_items for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create index if not exists investment_assets_project_idx on public.investment_assets(project_id);
create index if not exists financing_sources_project_idx on public.financing_sources(project_id);
create index if not exists loan_amortization_schedule_source_idx on public.loan_amortization_schedule(financing_source_id, period_number);
create index if not exists seating_capacity_periods_project_idx on public.seating_capacity_periods(project_id);
create index if not exists cost_items_project_area_idx on public.cost_items(project_id, area);
create index if not exists workflow_steps_project_idx on public.workflow_steps(project_id, step_index);
create index if not exists workflow_cost_items_project_step_idx on public.workflow_cost_items(project_id, step_index);

-- Explicit Data API grants required by Supabase for public schema tables.
-- RLS policies still decide which rows each authenticated user can access.
grant usage on schema public to anon, authenticated, service_role;

grant usage on type public.user_role to authenticated, service_role;
grant usage on type public.subscription_status to authenticated, service_role;
grant usage on type public.cost_kind to authenticated, service_role;
grant usage on type public.cost_area to authenticated, service_role;
grant usage on type public.workflow_step_status to authenticated, service_role;

grant select, insert, update, delete on table
  public.users,
  public.projects,
  public.investments,
  public.investment_assets,
  public.financing,
  public.financing_sources,
  public.loan_amortization_schedule,
  public.staff,
  public.variable_costs,
  public.purchase_categories,
  public.kpi_results,
  public.scenarios,
  public.cashflow,
  public.reports,
  public.seating_capacity_periods,
  public.cost_items,
  public.workflow_steps,
  public.workflow_cost_items
to authenticated;

grant select, insert, update, delete on table
  public.users,
  public.projects,
  public.investments,
  public.investment_assets,
  public.financing,
  public.financing_sources,
  public.loan_amortization_schedule,
  public.staff,
  public.variable_costs,
  public.purchase_categories,
  public.kpi_results,
  public.scenarios,
  public.cashflow,
  public.reports,
  public.seating_capacity_periods,
  public.cost_items,
  public.workflow_steps,
  public.workflow_cost_items
to service_role;

