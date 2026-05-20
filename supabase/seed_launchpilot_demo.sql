-- LaunchPilot demo seed
-- Uso consigliato: crea prima un utente demo con Supabase Auth, poi esegui questo file.
-- Lo script usa il primo utente presente in auth.users come proprietario del progetto demo.

create extension if not exists "uuid-ossp";

do $$
declare
  demo_user_id uuid;
  demo_project_id uuid := '11111111-1111-4111-8111-111111111111';
  bank_source_id uuid := '22222222-2222-4222-8222-222222222222';
  leasing_source_id uuid := '33333333-3333-4333-8333-333333333333';
  m integer;
  balance numeric := 145000;
  monthly_rate numeric := 0.054 / 12;
  payment numeric := 2359.64;
  interest numeric;
  principal numeric;
begin
  select id into demo_user_id from auth.users order by created_at limit 1;

  if demo_user_id is null then
    raise exception 'Crea prima un utente demo in Supabase Auth, poi riesegui questo seed.';
  end if;

  insert into public.users (id, email, role, subscription_status)
  values (demo_user_id, 'demo@launchpilot.local', 'client', 'demo')
  on conflict (id) do update set subscription_status = excluded.subscription_status;

  insert into public.projects (id, user_id, name, restaurant_format, city, seats, average_ticket, opening_days, covers_per_day, vat_included)
  values (demo_project_id, demo_user_id, 'Demo ristorante centro Milano', 'Ristorante contemporaneo', 'Milano', 58, 42, 26, 86, false)
  on conflict (id) do update set
    name = excluded.name,
    restaurant_format = excluded.restaurant_format,
    city = excluded.city,
    seats = excluded.seats,
    average_ticket = excluded.average_ticket,
    opening_days = excluded.opening_days,
    covers_per_day = excluded.covers_per_day,
    updated_at = now();

  delete from public.loan_amortization_schedule where financing_source_id in (bank_source_id, leasing_source_id);
  delete from public.financing_sources where project_id = demo_project_id;
  delete from public.financing where project_id = demo_project_id;
  delete from public.investment_assets where project_id = demo_project_id;
  delete from public.investments where project_id = demo_project_id;
  delete from public.staff where project_id = demo_project_id;
  delete from public.variable_costs where project_id = demo_project_id;
  delete from public.purchase_categories where project_id = demo_project_id;
  delete from public.kpi_results where project_id = demo_project_id;
  delete from public.scenarios where project_id = demo_project_id;
  delete from public.cashflow where project_id = demo_project_id;
  delete from public.reports where project_id = demo_project_id;

  insert into public.investments (project_id, category, description, quantity, unit_price, vat_rate, vat_included, amortizable, useful_life_years, residual_value) values
    (demo_project_id, 'Cucina', 'Cucina professionale completa', 1, 72000, 22, false, true, 10, 0),
    (demo_project_id, 'Arredi', 'Arredi sala, tavoli, sedute e banco', 1, 36000, 22, false, true, 8, 0),
    (demo_project_id, 'Impianti', 'Impianti, climatizzazione e aspirazione', 1, 42000, 22, false, true, 10, 0),
    (demo_project_id, 'Ristrutturazioni', 'Opere murarie e adeguamento locale', 1, 54000, 10, false, true, 10, 0),
    (demo_project_id, 'Hardware', 'Cassa, POS, stampanti e palmari', 1, 8500, 22, false, true, 5, 0),
    (demo_project_id, 'Software', 'Gestionale, prenotazioni e setup digitale', 1, 6500, 22, false, true, 3, 0),
    (demo_project_id, 'Marketing', 'Lancio, identita e comunicazione iniziale', 1, 14500, 22, false, false, 1, 0),
    (demo_project_id, 'Capitale circolante', 'Scorte iniziali e piccola cassa operativa', 1, 24000, 0, false, false, 1, 0);

  insert into public.investment_assets (project_id, category, description, purchase_value, useful_life_years, depreciation_rate, first_year_half, annual_depreciation, residual_value) values
    (demo_project_id, 'Cucina professionale', 'Cucina professionale completa', 72000, 10, 10, true, 3600, 68400),
    (demo_project_id, 'Arredi', 'Arredi sala, tavoli, sedute e banco', 36000, 8, 12.5, true, 2250, 33750),
    (demo_project_id, 'Impianti', 'Impianti e climatizzazione', 42000, 10, 10, true, 2100, 39900),
    (demo_project_id, 'Opere murarie', 'Adeguamento locale', 54000, 10, 10, true, 2700, 51300),
    (demo_project_id, 'Computer', 'Cassa, POS e palmari', 8500, 5, 20, true, 850, 7650),
    (demo_project_id, 'Software', 'Gestionale e prenotazioni', 6500, 3, 33.3, true, 1083, 5417);

  insert into public.staff (project_id, role, people, annual_cost, monthly_cost, charges_included) values
    (demo_project_id, 'Chef responsabile', 1, 72800, 5200, true),
    (demo_project_id, 'Cuoco', 1, 50400, 3600, true),
    (demo_project_id, 'Aiuto cuoco', 1, 39200, 2800, true),
    (demo_project_id, 'Responsabile sala', 1, 47600, 3400, true),
    (demo_project_id, 'Camerieri sala', 2, 86800, 6200, true),
    (demo_project_id, 'Extra stagionali', 2, 50400, 4200, true);

  insert into public.variable_costs (project_id, name, monthly_amount, vat_rate, vat_included, preset_source) values
    (demo_project_id, 'Energia elettrica', 3900, 22, false, 'demo realistico'),
    (demo_project_id, 'Gas', 1350, 22, false, 'demo realistico'),
    (demo_project_id, 'Acqua', 520, 10, false, 'demo realistico'),
    (demo_project_id, 'Pulizie e lavanderia', 1800, 22, false, 'demo realistico'),
    (demo_project_id, 'POS e commissioni bancarie', 950, 22, false, 'demo realistico'),
    (demo_project_id, 'Software operativo', 620, 22, false, 'demo realistico');

  insert into public.purchase_categories (project_id, name, incidence_pct, monthly_amount, vat_rate, suggested_value) values
    (demo_project_id, 'Food', 28, 26250, 10, 26250),
    (demo_project_id, 'Beverage', 8, 7400, 22, 7400),
    (demo_project_id, 'Packaging', 1.8, 1690, 22, 1690),
    (demo_project_id, 'Detergenza', 1.1, 1030, 22, 1030),
    (demo_project_id, 'Commissioni delivery', 2.2, 2065, 22, 2065),
    (demo_project_id, 'Marketing operativo', 1.5, 1400, 22, 1400);

  insert into public.financing_sources (id, project_id, type, name, amount, duration_months, annual_rate, monthly_payment, grace_period_months, payment_frequency, guarantees, notes) values
    (bank_source_id, demo_project_id, 'bank', 'Finanziamento bancario apertura', 145000, 72, 5.4, payment, 0, 'monthly', 'Garanzia soci / MCC se disponibile', 'Piano alla francese'),
    (leasing_source_id, demo_project_id, 'leasing', 'Leasing attrezzature sala e cucina', 32000, 60, 6.2, 622, 0, 'monthly', 'Bene in garanzia', 'Alternativa ad acquisto diretto'),
    (uuid_generate_v4(), demo_project_id, 'own', 'Mezzi propri soci', 85000, 0, 0, 0, 0, 'one_time', null, 'Capitale disponibile subito'),
    (uuid_generate_v4(), demo_project_id, 'grant', 'Contributo pubblico prudenziale', 26000, 0, 0, 0, 0, 'one_time', null, 'Probabilita alta, da non trattare come certo fino a delibera');

  insert into public.financing (project_id, financing_type, financed_amount, down_payment, duration_months, annual_interest_rate, payment_frequency, grace_period_months)
  values (demo_project_id, 'bank', 145000, 0, 72, 5.4, 'monthly', 0);

  for m in 1..72 loop
    interest := balance * monthly_rate;
    principal := least(payment - interest, balance);
    insert into public.loan_amortization_schedule (financing_source_id, period_number, payment_date, opening_balance, payment_amount, principal_amount, interest_amount, closing_balance)
    values (bank_source_id, m, current_date + ((m || ' months')::interval), balance, payment, principal, interest, greatest(balance - principal, 0));
    balance := greatest(balance - principal, 0);
  end loop;

  insert into public.kpi_results (project_id, revenue_monthly, ebitda_monthly, food_cost_pct, beverage_cost_pct, labor_cost_pct, break_even_covers, dscr, score, sustainability)
  values (demo_project_id, 93840, 17900, 28, 8, 26.1, 1298, 4.8, 84, 'green');

  insert into public.scenarios (project_id, name, average_ticket, food_cost_pct, occupancy_pct, revenue, margin) values
    (demo_project_id, 'A - prudente', 34, 30, 55, 695640, 64500),
    (demo_project_id, 'B - realista', 42, 28, 75, 1126944, 214800),
    (demo_project_id, 'C - ottimista', 50, 25, 88, 1636800, 402000);

  for m in 1..12 loop
    insert into public.cashflow (project_id, month_index, initial_cash, investment_outflows, financing_payments, estimated_taxes, vat_balance, working_capital, operating_cashflow, net_cashflow, closing_cash)
    values (demo_project_id, m, 52000, case when m = 1 then 257500 else 0 end, 2982, case when m in (6, 12) then 12000 else 0 end, 2500, 1500, 17900 + (case when m in (6,7,8,12) then 4200 else 0 end), 0, 52000 + (m * 12200));
  end loop;

  insert into public.reports (project_id, title, storage_path)
  values (demo_project_id, 'Business plan demo LaunchPilot', 'demo/launchpilot-business-plan.pdf');
end $$;
