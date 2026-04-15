-- Extend settings singleton with operator-friendly admin configuration fields.

alter table public.settings
  add column if not exists delivery_logistics_cost numeric(12,2) not null default 0 check (delivery_logistics_cost >= 0),
  add column if not exists default_requested_days integer not null default 30 check (default_requested_days > 0),
  add column if not exists minimum_advance_days integer not null default 0 check (minimum_advance_days >= 0),
  add column if not exists max_dogs_per_budget integer not null default 4 check (max_dogs_per_budget > 0),
  add column if not exists whatsapp_signature text,
  add column if not exists enable_whatsapp_notifications boolean not null default true,
  add column if not exists business_name text not null default 'Mi emprendimiento',
  add column if not exists business_phone text,
  add column if not exists business_email text,
  add column if not exists timezone_label text not null default 'America/Argentina/Buenos_Aires',
  add column if not exists auto_expire_budgets boolean not null default true,
  add column if not exists show_unit_costs_in_preview boolean not null default false,
  add column if not exists require_internal_notes boolean not null default false,
  add column if not exists satisfaction_survey_enabled boolean not null default false,
  add column if not exists satisfaction_survey_url text,
  add column if not exists satisfaction_survey_message text;
