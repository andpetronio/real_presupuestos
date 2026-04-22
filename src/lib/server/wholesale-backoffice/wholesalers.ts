import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WholesalerCategoryOption,
  WholesalerFormValues,
} from "$lib/types/view-models/wholesalers";

export const parseText = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value.trim() : "";

export const normalizeOptionalText = (
  value: FormDataEntryValue | null,
): string | null => {
  const parsed = parseText(value);
  return parsed.length > 0 ? parsed : null;
};

export const normalizeCode = (value: FormDataEntryValue | null): string =>
  parseText(value).toUpperCase();

export const parseInteger = (value: FormDataEntryValue | null): number => {
  const parsed = Math.floor(Number(typeof value === "string" ? value : "0"));
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, parsed);
};

export const normalizeTaxId = (
  value: FormDataEntryValue | null,
): string | null => {
  const parsed = normalizeOptionalText(value);
  return parsed ? parsed.slice(0, 13) : null;
};

export const normalizeWhatsapp = (
  value: FormDataEntryValue | null,
): string | null => normalizeOptionalText(value);

export const normalizeEmail = (
  value: FormDataEntryValue | null,
): string | null => {
  const parsed = normalizeOptionalText(value);
  return parsed ? parsed.toLowerCase() : null;
};

export const isValidEmail = (value: string | null): boolean => {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

export const getWholesalerFormValues = (params: {
  formData: FormData;
  fallbackCode?: string;
  fallbackMinTotalUnits?: string;
}): WholesalerFormValues => ({
  name: parseText(params.formData.get("name")),
  categoryId: parseText(params.formData.get("categoryId")),
  code:
    normalizeCode(params.formData.get("code")) || (params.fallbackCode ?? ""),
  minTotalUnits:
    parseText(params.formData.get("minTotalUnits")) ||
    (params.fallbackMinTotalUnits ?? "1"),
  taxId: parseText(params.formData.get("taxId")).slice(0, 13),
  contactFullName: parseText(params.formData.get("contactFullName")),
  contactWhatsapp: parseText(params.formData.get("contactWhatsapp")),
  contactEmail: parseText(params.formData.get("contactEmail")).toLowerCase(),
  address: parseText(params.formData.get("address")),
  deliveryPreference: parseText(params.formData.get("deliveryPreference")),
  paymentPreference: parseText(params.formData.get("paymentPreference")),
  notes: parseText(params.formData.get("notes")),
});

export const mapWholesalerCategoryOptions = (
  categories:
    | Array<{ id: string; name: string; is_active: boolean }>
    | null
    | undefined,
): WholesalerCategoryOption[] =>
  (categories ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    is_active: category.is_active,
  }));

export const getWholesalerError = (
  action: "create" | "update",
  errorMessage: string | undefined,
): string => {
  if (!errorMessage) {
    return action === "create"
      ? "No pudimos crear el mayorista. Reintentá en unos segundos."
      : "No pudimos guardar los cambios del mayorista. Reintentá en unos segundos.";
  }

  const normalized = errorMessage.toLowerCase();
  if (normalized.includes("wholesalers_unique_random_code_unique")) {
    return "Ya existe un mayorista con ese código.";
  }
  if (normalized.includes("wholesalers_tax_id_unique")) {
    return "Ya existe un mayorista con ese CUIT/DNI.";
  }

  return action === "create"
    ? "No pudimos crear el mayorista. Reintentá en unos segundos."
    : "No pudimos guardar los cambios del mayorista. Reintentá en unos segundos.";
};

export const generateWholesalerCode = async (
  supabase: SupabaseClient,
): Promise<string> => {
  const result = await supabase.rpc("generate_wholesaler_code", {
    p_length: 10,
  });
  return typeof result.data === "string" ? result.data : "";
};
