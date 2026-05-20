export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type RowId = string;
type Timestamp = string;

type CostKind = "fixed" | "variable" | "one_time";
type CostArea = "staff" | "food" | "other";
type WorkflowStepStatus = "draft" | "confirmed";

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: RowId;
          user_id: RowId;
          name: string;
          restaurant_format: string | null;
          city: string | null;
          seats: number;
          average_ticket: number;
          opening_days: number;
          covers_per_day: number;
          opening_days_annual: number;
          lunch_enabled: boolean;
          dinner_enabled: boolean;
          default_occupancy_pct: number;
          vat_included: boolean;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & { user_id: RowId; name: string };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
      };
      seating_capacity_periods: {
        Row: {
          id: RowId;
          project_id: RowId;
          label: string;
          start_month: number;
          end_month: number;
          opening_days: number;
          seats: number;
          lunch_enabled: boolean;
          dinner_enabled: boolean;
          notes: string | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["seating_capacity_periods"]["Row"]> & { project_id: RowId; label: string; start_month: number; end_month: number };
        Update: Partial<Database["public"]["Tables"]["seating_capacity_periods"]["Row"]>;
      };
      cost_items: {
        Row: {
          id: RowId;
          project_id: RowId;
          area: CostArea;
          kind: CostKind;
          category: string;
          name: string;
          monthly_amount: number;
          annual_amount: number;
          incidence_pct: number;
          vat_rate: number;
          vat_included: boolean;
          editable: boolean;
          source_step_index: number | null;
          notes: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["cost_items"]["Row"]> & { project_id: RowId; category: string; name: string };
        Update: Partial<Database["public"]["Tables"]["cost_items"]["Row"]>;
      };
      investment_assets: {
        Row: {
          id: RowId;
          project_id: RowId;
          category: string;
          description: string;
          purchase_value: number;
          useful_life_years: number;
          depreciation_rate: number;
          first_year_half: boolean;
          annual_depreciation: number;
          residual_value: number;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["investment_assets"]["Row"]> & { project_id: RowId; category: string; description: string };
        Update: Partial<Database["public"]["Tables"]["investment_assets"]["Row"]>;
      };
      financing_sources: {
        Row: {
          id: RowId;
          project_id: RowId;
          type: string;
          name: string;
          amount: number;
          duration_months: number;
          annual_rate: number;
          monthly_payment: number;
          grace_period_months: number;
          payment_frequency: string;
          guarantees: string | null;
          notes: string | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["financing_sources"]["Row"]> & { project_id: RowId; type: string; name: string };
        Update: Partial<Database["public"]["Tables"]["financing_sources"]["Row"]>;
      };
      loan_amortization_schedule: {
        Row: {
          id: RowId;
          financing_source_id: RowId;
          period_number: number;
          payment_date: string | null;
          opening_balance: number;
          payment_amount: number;
          principal_amount: number;
          interest_amount: number;
          closing_balance: number;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["loan_amortization_schedule"]["Row"]> & { financing_source_id: RowId; period_number: number };
        Update: Partial<Database["public"]["Tables"]["loan_amortization_schedule"]["Row"]>;
      };
      staff: {
        Row: {
          id: RowId;
          project_id: RowId;
          role: string;
          people: number;
          annual_cost: number;
          monthly_cost: number;
          charges_included: boolean;
          seasonal: boolean;
          season_start_month: number | null;
          season_end_month: number | null;
          months_per_year: number;
          service_shift: string | null;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["staff"]["Row"]> & { project_id: RowId; role: string };
        Update: Partial<Database["public"]["Tables"]["staff"]["Row"]>;
      };
      scenarios: {
        Row: {
          id: RowId;
          project_id: RowId;
          name: string;
          scenario_key: string | null;
          label: string | null;
          tone: string | null;
          average_ticket: number;
          food_cost_pct: number;
          other_variable_pct: number;
          occupancy_pct: number;
          opening_days_annual: number;
          seats: number;
          lunch_enabled: boolean;
          dinner_enabled: boolean;
          capacity_covers_annual: number;
          customers_annual: number;
          customers_daily: number;
          personnel_annual: number;
          other_fixed_annual: number;
          variable_costs: number;
          fixed_costs: number;
          revenue: number;
          margin: number;
          ebitda: number;
          ebit: number;
          cash_after_debt: number;
        };
        Insert: Partial<Database["public"]["Tables"]["scenarios"]["Row"]> & { project_id: RowId; name: string; average_ticket: number; food_cost_pct: number; occupancy_pct: number };
        Update: Partial<Database["public"]["Tables"]["scenarios"]["Row"]>;
      };
      workflow_steps: {
        Row: {
          id: RowId;
          project_id: RowId;
          step_index: number;
          name: string;
          status: WorkflowStepStatus;
          confirmed_at: Timestamp | null;
          confirmed_by: RowId | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["workflow_steps"]["Row"]> & { project_id: RowId; step_index: number; name: string };
        Update: Partial<Database["public"]["Tables"]["workflow_steps"]["Row"]>;
      };
      workflow_cost_items: {
        Row: {
          id: RowId;
          project_id: RowId;
          step_index: number;
          label: string;
          category: string;
          amount: number;
          vat_rate: number;
          vat_included: boolean;
          enabled: boolean;
          custom: boolean;
          kind: CostKind;
          confirmed: boolean;
          notes: string | null;
          created_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["workflow_cost_items"]["Row"]> & { project_id: RowId; step_index: number; label: string; category: string };
        Update: Partial<Database["public"]["Tables"]["workflow_cost_items"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      cost_kind: CostKind;
      cost_area: CostArea;
      workflow_step_status: WorkflowStepStatus;
      user_role: "super_admin" | "client";
      subscription_status: "demo" | "active" | "past_due" | "cancelled";
    };
  };
};
