-- Investment assets for professional depreciation planning.
-- Keeps cash investment and economic depreciation clearly separated.

create table if not exists public.investment_assets (
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

alter table public.investment_assets enable row level security;

create policy "Project owners can manage investment assets"
on public.investment_assets for all
using (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())))
with check (exists (select 1 from public.projects p where p.id = project_id and (p.user_id = auth.uid() or public.is_super_admin())));

create index if not exists investment_assets_project_idx on public.investment_assets(project_id);

grant select, insert, update, delete on table public.investment_assets to authenticated;
grant select, insert, update, delete on table public.investment_assets to service_role;
