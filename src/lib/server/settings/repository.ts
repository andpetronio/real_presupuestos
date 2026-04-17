import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultSettings,
  type SettingsRow,
} from "$lib/server/settings/validation";

const settingsSelect =
  "meal_plan_margin, budget_validity_days, vacuum_bag_small_unit_cost, vacuum_bag_large_unit_cost, label_unit_cost, non_woven_bag_unit_cost, labor_hour_cost, cooking_hour_cost, calcium_unit_cost, kefir_unit_cost, delivery_logistics_cost, default_requested_days, minimum_advance_days, max_dogs_per_budget, whatsapp_sender_number, whatsapp_default_template, whatsapp_signature, enable_whatsapp_notifications, business_name, business_phone, business_email, timezone_label, auto_expire_budgets, show_unit_costs_in_preview, require_internal_notes, satisfaction_survey_enabled, satisfaction_survey_url, satisfaction_survey_message, bank_cbu, bank_alias, bank_account_holder, bank_provider";

export const loadSettings = async (
  supabase: SupabaseClient,
): Promise<SettingsRow> => {
  const { data, error } = await supabase
    .from("settings")
    .select(settingsSelect)
    .eq("id", 1)
    .single();

  if (error) throw error;

  return {
    ...defaultSettings,
    ...(data ?? {}),
  } as SettingsRow;
};

export const saveSettings = async (
  supabase: SupabaseClient,
  payload: SettingsRow,
): Promise<void> => {
  const { error } = await supabase.from("settings").upsert(
    {
      id: 1,
      ...payload,
    },
    { onConflict: "id" },
  );

  if (error) throw error;
};
