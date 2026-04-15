import {
  containsBrokenUnicode,
  normalizeTemplateText,
} from "$lib/server/whatsapp/template";

type NumericFieldRule = {
  min?: number;
  max?: number;
  label: string;
};

export type SettingsRow = {
  meal_plan_margin: number;
  budget_validity_days: number;
  vacuum_bag_small_unit_cost: number;
  vacuum_bag_large_unit_cost: number;
  label_unit_cost: number;
  non_woven_bag_unit_cost: number;
  labor_hour_cost: number;
  cooking_hour_cost: number;
  calcium_unit_cost: number;
  kefir_unit_cost: number;
  delivery_logistics_cost: number;
  default_requested_days: number;
  minimum_advance_days: number;
  max_dogs_per_budget: number;
  whatsapp_sender_number: string | null;
  whatsapp_default_template: string | null;
  whatsapp_signature: string | null;
  enable_whatsapp_notifications: boolean;
  business_name: string;
  business_phone: string | null;
  business_email: string | null;
  timezone_label: string;
  auto_expire_budgets: boolean;
  show_unit_costs_in_preview: boolean;
  require_internal_notes: boolean;
  satisfaction_survey_enabled: boolean;
  satisfaction_survey_url: string | null;
  satisfaction_survey_message: string | null;
};

export type SettingsFormValues = {
  mealPlanMarginPercent: string;
  budgetValidityDays: string;
  vacuumBagSmallUnitCost: string;
  vacuumBagLargeUnitCost: string;
  labelUnitCost: string;
  nonWovenBagUnitCost: string;
  laborHourCost: string;
  cookingHourCost: string;
  calciumUnitCost: string;
  kefirUnitCost: string;
  deliveryLogisticsCost: string;
  defaultRequestedDays: string;
  minimumAdvanceDays: string;
  maxDogsPerBudget: string;
  whatsappSenderNumber: string;
  whatsappDefaultTemplate: string;
  whatsappSignature: string;
  enableWhatsappNotifications: boolean;
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  timezoneLabel: string;
  autoExpireBudgets: boolean;
  showUnitCostsInPreview: boolean;
  requireInternalNotes: boolean;
  satisfactionSurveyEnabled: boolean;
  satisfactionSurveyUrl: string;
  satisfactionSurveyMessage: string;
};

export type SettingsValidationFailure = {
  ok: false;
  operatorError: string;
  fieldErrors: ReadonlyArray<string>;
  values: SettingsFormValues;
};

export type SettingsValidationSuccess = {
  ok: true;
  payload: SettingsRow;
  values: SettingsFormValues;
};

export type SettingsValidationResult =
  | SettingsValidationFailure
  | SettingsValidationSuccess;

export const defaultSettings: SettingsRow = {
  meal_plan_margin: 0,
  budget_validity_days: 7,
  vacuum_bag_small_unit_cost: 0,
  vacuum_bag_large_unit_cost: 0,
  label_unit_cost: 0,
  non_woven_bag_unit_cost: 0,
  labor_hour_cost: 0,
  cooking_hour_cost: 0,
  calcium_unit_cost: 5000,
  kefir_unit_cost: 5000,
  delivery_logistics_cost: 0,
  default_requested_days: 30,
  minimum_advance_days: 0,
  max_dogs_per_budget: 4,
  whatsapp_sender_number: null,
  whatsapp_default_template: null,
  whatsapp_signature: null,
  enable_whatsapp_notifications: true,
  business_name: "Mi emprendimiento",
  business_phone: null,
  business_email: null,
  timezone_label: "America/Argentina/Buenos_Aires",
  auto_expire_budgets: true,
  show_unit_costs_in_preview: false,
  require_internal_notes: false,
  satisfaction_survey_enabled: false,
  satisfaction_survey_url: null,
  satisfaction_survey_message: null,
};

const parseText = (value: FormDataEntryValue | null): string =>
  typeof value === "string" ? value.trim() : "";

const parseBoolean = (value: FormDataEntryValue | null): boolean =>
  value === "on";

const parseNumber = (
  rawValue: string,
  rule: NumericFieldRule,
): number | null => {
  if (!rawValue) return null;
  const numeric = Number(rawValue.replace(",", "."));
  if (!Number.isFinite(numeric)) return null;
  if (rule.min !== undefined && numeric < rule.min) return null;
  if (rule.max !== undefined && numeric > rule.max) return null;
  return numeric;
};

const normalizeOptionalText = (value: string): string | null =>
  value ? value : null;

const isValidPhone = (value: string): boolean => /^\+?[0-9]{8,15}$/.test(value);

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const readSettingsFormValues = (
  formData: FormData,
): SettingsFormValues => ({
  mealPlanMarginPercent: parseText(formData.get("mealPlanMarginPercent")),
  budgetValidityDays: parseText(formData.get("budgetValidityDays")),
  vacuumBagSmallUnitCost: parseText(formData.get("vacuumBagSmallUnitCost")),
  vacuumBagLargeUnitCost: parseText(formData.get("vacuumBagLargeUnitCost")),
  labelUnitCost: parseText(formData.get("labelUnitCost")),
  nonWovenBagUnitCost: parseText(formData.get("nonWovenBagUnitCost")),
  laborHourCost: parseText(formData.get("laborHourCost")),
  cookingHourCost: parseText(formData.get("cookingHourCost")),
  calciumUnitCost: parseText(formData.get("calciumUnitCost")),
  kefirUnitCost: parseText(formData.get("kefirUnitCost")),
  deliveryLogisticsCost: parseText(formData.get("deliveryLogisticsCost")),
  defaultRequestedDays: parseText(formData.get("defaultRequestedDays")),
  minimumAdvanceDays: parseText(formData.get("minimumAdvanceDays")),
  maxDogsPerBudget: parseText(formData.get("maxDogsPerBudget")),
  whatsappSenderNumber: parseText(formData.get("whatsappSenderNumber")),
  whatsappDefaultTemplate: parseText(formData.get("whatsappDefaultTemplate")),
  whatsappSignature: parseText(formData.get("whatsappSignature")),
  enableWhatsappNotifications: parseBoolean(
    formData.get("enableWhatsappNotifications"),
  ),
  businessName: parseText(formData.get("businessName")),
  businessPhone: parseText(formData.get("businessPhone")),
  businessEmail: parseText(formData.get("businessEmail")),
  timezoneLabel: parseText(formData.get("timezoneLabel")),
  autoExpireBudgets: parseBoolean(formData.get("autoExpireBudgets")),
  showUnitCostsInPreview: parseBoolean(formData.get("showUnitCostsInPreview")),
  requireInternalNotes: parseBoolean(formData.get("requireInternalNotes")),
  satisfactionSurveyEnabled: parseBoolean(
    formData.get("satisfactionSurveyEnabled"),
  ),
  satisfactionSurveyUrl: parseText(formData.get("satisfactionSurveyUrl")),
  satisfactionSurveyMessage: parseText(
    formData.get("satisfactionSurveyMessage"),
  ),
});

export const validateAndNormalizeSettings = (
  values: SettingsFormValues,
): SettingsValidationResult => {
  const fieldErrors: string[] = [];

  const mealPlanMarginPercent = parseNumber(values.mealPlanMarginPercent, {
    min: 0,
    max: 90,
    label: "Margen comercial",
  });
  if (mealPlanMarginPercent === null) {
    fieldErrors.push("Margen comercial: ingresá un porcentaje entre 0 y 90.");
  }

  const budgetValidityDays = parseNumber(values.budgetValidityDays, {
    min: 1,
    max: 90,
    label: "Validez del presupuesto",
  });
  if (budgetValidityDays === null) {
    fieldErrors.push("Validez del presupuesto: definí entre 1 y 90 días.");
  }

  const defaultRequestedDays = parseNumber(values.defaultRequestedDays, {
    min: 1,
    max: 120,
    label: "Días sugeridos por presupuesto",
  });
  if (defaultRequestedDays === null) {
    fieldErrors.push("Días sugeridos: definí entre 1 y 120 días.");
  }

  const minimumAdvanceDays = parseNumber(values.minimumAdvanceDays, {
    min: 0,
    max: 30,
    label: "Anticipación mínima",
  });
  if (minimumAdvanceDays === null) {
    fieldErrors.push("Anticipación mínima: usá un valor entre 0 y 30 días.");
  }

  const maxDogsPerBudget = parseNumber(values.maxDogsPerBudget, {
    min: 1,
    max: 12,
    label: "Cantidad máxima de perros",
  });
  if (maxDogsPerBudget === null) {
    fieldErrors.push("Cantidad máxima de perros: definí entre 1 y 12.");
  }

  const costFields: Array<{ label: string; value: string }> = [
    {
      label: "Costo de bolsa al vacío chica",
      value: values.vacuumBagSmallUnitCost,
    },
    {
      label: "Costo de bolsa al vacío grande",
      value: values.vacuumBagLargeUnitCost,
    },
    { label: "Costo de etiqueta", value: values.labelUnitCost },
    { label: "Costo de bolsa no tejida", value: values.nonWovenBagUnitCost },
    { label: "Costo por hora de mano de obra", value: values.laborHourCost },
    { label: "Costo por hora de cocción", value: values.cookingHourCost },
    { label: "Costo unitario de calcio", value: values.calciumUnitCost },
    { label: "Costo unitario de kefir", value: values.kefirUnitCost },
    {
      label: "Costo logístico por entrega",
      value: values.deliveryLogisticsCost,
    },
  ];

  const parsedCosts = costFields.map((field) => {
    const parsed = parseNumber(field.value, {
      min: 0,
      max: 9999999,
      label: field.label,
    });
    if (parsed === null) {
      fieldErrors.push(
        `${field.label}: ingresá un monto válido mayor o igual a 0.`,
      );
    }
    return parsed;
  });

  if (!values.businessName) {
    fieldErrors.push(
      "Nombre comercial: completá cómo querés que se vea en el presupuesto.",
    );
  }

  if (!values.timezoneLabel) {
    fieldErrors.push(
      "Zona horaria: ingresá una referencia como America/Argentina/Buenos_Aires.",
    );
  }

  if (
    values.whatsappSenderNumber &&
    !isValidPhone(values.whatsappSenderNumber)
  ) {
    fieldErrors.push(
      "Número remitente de WhatsApp: usá formato internacional, por ejemplo +54911...",
    );
  }

  if (values.businessPhone && !isValidPhone(values.businessPhone)) {
    fieldErrors.push(
      "Teléfono de contacto: usá solo números y prefijo opcional +.",
    );
  }

  if (values.businessEmail && !isValidEmail(values.businessEmail)) {
    fieldErrors.push("Correo de contacto: ingresá un email válido.");
  }

  if (values.satisfactionSurveyEnabled && !values.satisfactionSurveyUrl) {
    fieldErrors.push(
      "Si activás la encuesta, completá el enlace para que el cliente pueda responder.",
    );
  }

  if (
    values.satisfactionSurveyUrl &&
    !isValidUrl(values.satisfactionSurveyUrl)
  ) {
    fieldErrors.push(
      "Enlace de encuesta: ingresá una URL válida (http/https).",
    );
  }

  if (values.whatsappDefaultTemplate.length > 1500) {
    fieldErrors.push(
      "Mensaje base de WhatsApp: mantenelo por debajo de 1500 caracteres.",
    );
  }

  if (containsBrokenUnicode(values.whatsappDefaultTemplate)) {
    fieldErrors.push(
      "Mensaje base de WhatsApp: contiene caracteres inválidos (�). Reescribí o pegá de nuevo los emojis.",
    );
  }

  if (values.whatsappSignature.length > 180) {
    fieldErrors.push(
      "Firma de WhatsApp: mantenela por debajo de 180 caracteres.",
    );
  }

  if (values.satisfactionSurveyMessage.length > 280) {
    fieldErrors.push(
      "Texto de invitación a encuesta: mantenelo por debajo de 280 caracteres.",
    );
  }

  if (fieldErrors.length > 0) {
    return {
      ok: false,
      operatorError:
        "Hay campos por corregir antes de guardar la configuración.",
      fieldErrors,
      values,
    };
  }

  const normalizedWhatsappTemplate = normalizeTemplateText(
    values.whatsappDefaultTemplate,
  );

  return {
    ok: true,
    values: {
      ...values,
      whatsappDefaultTemplate: normalizedWhatsappTemplate,
    },
    payload: {
      meal_plan_margin: Number(
        ((mealPlanMarginPercent as number) / 100).toFixed(4),
      ),
      budget_validity_days: Math.round(budgetValidityDays as number),
      vacuum_bag_small_unit_cost: Number((parsedCosts[0] as number).toFixed(2)),
      vacuum_bag_large_unit_cost: Number((parsedCosts[1] as number).toFixed(2)),
      label_unit_cost: Number((parsedCosts[2] as number).toFixed(2)),
      non_woven_bag_unit_cost: Number((parsedCosts[3] as number).toFixed(2)),
      labor_hour_cost: Number((parsedCosts[4] as number).toFixed(2)),
      cooking_hour_cost: Number((parsedCosts[5] as number).toFixed(2)),
      calcium_unit_cost: Number((parsedCosts[6] as number).toFixed(2)),
      kefir_unit_cost: Number((parsedCosts[7] as number).toFixed(2)),
      delivery_logistics_cost: Number((parsedCosts[8] as number).toFixed(2)),
      default_requested_days: Math.round(defaultRequestedDays as number),
      minimum_advance_days: Math.round(minimumAdvanceDays as number),
      max_dogs_per_budget: Math.round(maxDogsPerBudget as number),
      whatsapp_sender_number: normalizeOptionalText(
        values.whatsappSenderNumber,
      ),
      whatsapp_default_template: normalizeOptionalText(
        normalizedWhatsappTemplate,
      ),
      whatsapp_signature: normalizeOptionalText(values.whatsappSignature),
      enable_whatsapp_notifications: values.enableWhatsappNotifications,
      business_name: values.businessName,
      business_phone: normalizeOptionalText(values.businessPhone),
      business_email: normalizeOptionalText(values.businessEmail),
      timezone_label: values.timezoneLabel,
      auto_expire_budgets: values.autoExpireBudgets,
      show_unit_costs_in_preview: values.showUnitCostsInPreview,
      require_internal_notes: values.requireInternalNotes,
      satisfaction_survey_enabled: values.satisfactionSurveyEnabled,
      satisfaction_survey_url: normalizeOptionalText(
        values.satisfactionSurveyUrl,
      ),
      satisfaction_survey_message: normalizeOptionalText(
        values.satisfactionSurveyMessage,
      ),
    },
  };
};

export const toFormValuesFromSettings = (
  settings: SettingsRow,
): SettingsFormValues => ({
  mealPlanMarginPercent: (settings.meal_plan_margin * 100).toString(),
  budgetValidityDays: settings.budget_validity_days.toString(),
  vacuumBagSmallUnitCost: settings.vacuum_bag_small_unit_cost.toString(),
  vacuumBagLargeUnitCost: settings.vacuum_bag_large_unit_cost.toString(),
  labelUnitCost: settings.label_unit_cost.toString(),
  nonWovenBagUnitCost: settings.non_woven_bag_unit_cost.toString(),
  laborHourCost: settings.labor_hour_cost.toString(),
  cookingHourCost: settings.cooking_hour_cost.toString(),
  calciumUnitCost: settings.calcium_unit_cost.toString(),
  kefirUnitCost: settings.kefir_unit_cost.toString(),
  deliveryLogisticsCost: settings.delivery_logistics_cost.toString(),
  defaultRequestedDays: settings.default_requested_days.toString(),
  minimumAdvanceDays: settings.minimum_advance_days.toString(),
  maxDogsPerBudget: settings.max_dogs_per_budget.toString(),
  whatsappSenderNumber: settings.whatsapp_sender_number ?? "",
  whatsappDefaultTemplate: settings.whatsapp_default_template ?? "",
  whatsappSignature: settings.whatsapp_signature ?? "",
  enableWhatsappNotifications: settings.enable_whatsapp_notifications,
  businessName: settings.business_name,
  businessPhone: settings.business_phone ?? "",
  businessEmail: settings.business_email ?? "",
  timezoneLabel: settings.timezone_label,
  autoExpireBudgets: settings.auto_expire_budgets,
  showUnitCostsInPreview: settings.show_unit_costs_in_preview,
  requireInternalNotes: settings.require_internal_notes,
  satisfactionSurveyEnabled: settings.satisfaction_survey_enabled,
  satisfactionSurveyUrl: settings.satisfaction_survey_url ?? "",
  satisfactionSurveyMessage: settings.satisfaction_survey_message ?? "",
});

export const getSettingsSaveError = (): string =>
  "No pudimos guardar la configuración. Probá de nuevo en unos segundos.";
