-- Add bank transfer configuration fields to settings for payment/receipt information

alter table public.settings
  add column if not exists bank_cbu text,
  add column if not exists bank_alias text,
  add column if not exists bank_account_holder text,
  add column if not exists bank_provider text not null default 'Naranja X';

-- Optional constraints (non-blocking)
comment on column public.settings.bank_cbu is 'CBU for bank transfers (22 digits)';
comment on column public.settings.bank_alias is 'Alias for bank transfers (e.g., REAL.ALIMENTO2)';
comment on column public.settings.bank_account_holder is 'Account holder name for bank transfers';
comment on column public.settings.bank_provider is 'Bank/provider name for transfers (e.g., Naranja X, Mercado Pago)';