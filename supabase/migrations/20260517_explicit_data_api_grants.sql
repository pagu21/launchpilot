-- Explicit grants for Supabase Data API access.
-- Supabase requires these grants for public schema tables created in new projects.
-- RLS remains enabled and continues to restrict row-level access.

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
  public.financing,
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
  public.financing,
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
