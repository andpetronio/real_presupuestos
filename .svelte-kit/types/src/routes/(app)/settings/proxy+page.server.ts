// @ts-nocheck
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { OperatorMessage } from '$lib/server/shared/ui-state';
import { loadSettings, saveSettings } from '$lib/server/settings/repository';
import {
  defaultSettings,
  getSettingsSaveError,
  readSettingsFormValues,
  type SettingsFormValues,
  toFormValuesFromSettings,
  validateAndNormalizeSettings
} from '$lib/server/settings/validation';

const fallbackErrorMessage: OperatorMessage = {
  kind: 'error',
  title: 'No pudimos cargar configuración',
  detail: 'Reintentá en unos segundos o verificá la conexión.',
  actionLabel: 'Reintentar'
};

type SettingsSection = 'operativos' | 'comercial' | 'whatsapp' | 'encuesta';

const isSettingsSection = (value: string | null): value is SettingsSection =>
  value === 'operativos' || value === 'comercial' || value === 'whatsapp' || value === 'encuesta';

const sectionFields: Record<SettingsSection, Array<keyof SettingsFormValues>> = {
  operativos: [
    'vacuumBagSmallUnitCost',
    'vacuumBagLargeUnitCost',
    'labelUnitCost',
    'nonWovenBagUnitCost',
    'laborHourCost',
    'cookingHourCost',
    'calciumUnitCost',
    'kefirUnitCost',
    'deliveryLogisticsCost'
  ],
  comercial: [
    'mealPlanMarginPercent',
    'budgetValidityDays',
    'defaultRequestedDays',
    'minimumAdvanceDays',
    'maxDogsPerBudget',
    'autoExpireBudgets',
    'showUnitCostsInPreview',
    'requireInternalNotes'
  ],
  whatsapp: [
    'businessName',
    'businessPhone',
    'businessEmail',
    'timezoneLabel',
    'whatsappDefaultTemplate',
    'enableWhatsappNotifications'
  ],
  encuesta: ['satisfactionSurveyEnabled', 'satisfactionSurveyUrl', 'satisfactionSurveyMessage']
};

const checkboxFields = new Set<keyof SettingsFormValues>([
  'enableWhatsappNotifications',
  'autoExpireBudgets',
  'showUnitCostsInPreview',
  'requireInternalNotes',
  'satisfactionSurveyEnabled'
]);

const mergeSectionValues = (params: {
  base: SettingsFormValues;
  submitted: SettingsFormValues;
  section: SettingsSection;
  formData: FormData;
}): SettingsFormValues => {
  const { base, submitted, section, formData } = params;
  const merged: SettingsFormValues = { ...base };
  const mutableMerged = merged as Record<keyof SettingsFormValues, string | boolean>;
  const submittedRecord = submitted as Record<keyof SettingsFormValues, string | boolean>;

  for (const field of sectionFields[section]) {
    if (checkboxFields.has(field)) {
      mutableMerged[field] = formData.has(String(field));
      continue;
    }

    mutableMerged[field] = submittedRecord[field];
  }

  return merged;
};

export const load = async ({ locals }: Parameters<PageServerLoad>[0]) => {
  try {
    const settings = await loadSettings(locals.supabase);

    return {
      formState: 'success',
      formMessage: {
        kind: 'success',
        title: 'Configuración cargada',
        detail: 'Podés ajustar costos, WhatsApp y reglas de presupuesto desde esta pantalla.'
      } satisfies OperatorMessage,
      settings,
      settingsForm: toFormValuesFromSettings(settings)
    };
  } catch {
    const settingsForm = toFormValuesFromSettings(defaultSettings);

    return {
      formState: 'error',
      formMessage: fallbackErrorMessage,
      settings: defaultSettings,
      settingsForm
    };
  }
};

export const actions = {
  update: async ({ request, locals }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    const sectionValue = formData.get('settingsSection');
    const parsedSection = typeof sectionValue === 'string' ? sectionValue : null;
    const section: SettingsSection = isSettingsSection(parsedSection)
      ? parsedSection
      : 'operativos';

    let currentSettings = defaultSettings;
    try {
      currentSettings = await loadSettings(locals.supabase);
    } catch {
      // Si no podemos cargar estado actual, validamos contra valores enviados.
    }

    const submittedValues = readSettingsFormValues(formData);
    const baseValues = toFormValuesFromSettings(currentSettings);
    const values = mergeSectionValues({
      base: baseValues,
      submitted: submittedValues,
      section,
      formData
    });
    const validation = validateAndNormalizeSettings(values);

    if (!validation.ok) {
      return fail(400, {
        actionType: 'update',
        operatorError: validation.operatorError,
        fieldErrors: validation.fieldErrors,
        values: validation.values
      });
    }

    try {
      await saveSettings(locals.supabase, validation.payload);
    } catch {
      return fail(400, {
        actionType: 'update',
        operatorError: getSettingsSaveError(),
        fieldErrors: [],
        values
      });
    }

    return {
      actionType: 'update',
      operatorSuccess: 'Configuración guardada correctamente.',
      fieldErrors: []
    };
  }
};
;null as any as Actions;