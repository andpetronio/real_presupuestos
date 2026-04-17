import { describe, expect, it } from 'vitest';
import {
  defaultSettings,
  readSettingsFormValues,
  toFormValuesFromSettings,
  validateAndNormalizeSettings
} from '$lib/server/settings/validation';

describe('settings validation', () => {
  it('normaliza payload válido', () => {
    const result = validateAndNormalizeSettings(
      toFormValuesFromSettings({
        ...defaultSettings,
        meal_plan_margin: 0.24,
        budget_validity_days: 12,
        satisfaction_survey_enabled: true,
        satisfaction_survey_url: 'https://example.com/survey'
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.payload.meal_plan_margin).toBe(0.24);
    expect(result.payload.budget_validity_days).toBe(12);
    expect(result.payload.satisfaction_survey_enabled).toBe(true);
  });

  it('rechaza encuesta activa sin URL', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      satisfactionSurveyEnabled: true,
      satisfactionSurveyUrl: ''
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('encuesta');
  });

  it('rechaza formato de remitente inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      enableWhatsappNotifications: true,
      whatsappSenderNumber: 'abc-123'
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('WhatsApp');
  });

  // ─── Meal plan margin boundary ──────────────────────────────────────────────
  it('valida margen 0% → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      mealPlanMarginPercent: '0'
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.meal_plan_margin).toBe(0);
  });

  it('valida margen 90% → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      mealPlanMarginPercent: '90'
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.meal_plan_margin).toBe(0.9);
  });

  it('rechaza margen 91% → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      mealPlanMarginPercent: '91'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('0 y 90');
  });

  // ─── Budget validity days boundary ─────────────────────────────────────────
  it('valida validez 1 día → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      budgetValidityDays: '1'
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.budget_validity_days).toBe(1);
  });

  it('valida validez 90 días → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      budgetValidityDays: '90'
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.budget_validity_days).toBe(90);
  });

  it('rechaza validez 91 días → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      budgetValidityDays: '91'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('1 y 90');
  });

  // ─── Max dogs per budget boundary ───────────────────────────────────────────
  it('valida 1 perro máximo → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      maxDogsPerBudget: '1'
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.max_dogs_per_budget).toBe(1);
  });

  it('valida 12 perros máximos → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      maxDogsPerBudget: '12'
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.max_dogs_per_budget).toBe(12);
  });

  it('rechaza 13 perros máximos → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      maxDogsPerBudget: '13'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('1 y 12');
  });

  // ─── WhatsApp template length ───────────────────────────────────────────────
  it('valida template de exactamente 1500 chars → válido', () => {
    const template = 'x'.repeat(1500);
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      whatsappDefaultTemplate: template
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza template de 1501 chars → inválido', () => {
    const template = 'x'.repeat(1501);
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      whatsappDefaultTemplate: template
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('1500 caracteres');
  });

  // ─── WhatsApp signature length ─────────────────────────────────────────────
  it('valida firma de exactamente 180 chars → válido', () => {
    const signature = 'x'.repeat(180);
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      whatsappSignature: signature
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza firma de 181 chars → inválido', () => {
    const signature = 'x'.repeat(181);
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      whatsappSignature: signature
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('180 caracteres');
  });

  // ─── Survey message length ───────────────────────────────────────────────────
  it('valida mensaje de encuesta de exactamente 280 chars → válido', () => {
    const message = 'x'.repeat(280);
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      satisfactionSurveyEnabled: true,
      satisfactionSurveyUrl: 'https://example.com/survey',
      satisfactionSurveyMessage: message
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza mensaje de encuesta de 281 chars → inválido', () => {
    const message = 'x'.repeat(281);
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      satisfactionSurveyEnabled: true,
      satisfactionSurveyUrl: 'https://example.com/survey',
      satisfactionSurveyMessage: message
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('280 caracteres');
  });

  // ─── Email validation ───────────────────────────────────────────────────────
  it('valida email bien formado → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      businessEmail: 'test@domain.com'
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza email mal formado → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      businessEmail: 'notanemail'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('email');
  });

  // ─── URL validation ─────────────────────────────────────────────────────────
  it('valida URL con https → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      satisfactionSurveyEnabled: true,
      satisfactionSurveyUrl: 'https://example.com'
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza URL con protocolo ftp → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      satisfactionSurveyEnabled: true,
      satisfactionSurveyUrl: 'ftp://invalid.com'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('URL');
  });

  it('rechaza texto que no es URL → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      satisfactionSurveyEnabled: true,
      satisfactionSurveyUrl: 'not-a-url'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('URL');
  });

  // ─── Phone validation ───────────────────────────────────────────────────────
  it('valida teléfono con prefijo internacional → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      whatsappSenderNumber: '+5491112345678'
    });
    expect(result.ok).toBe(true);
  });

  it('valida teléfono sin prefijo + → válido (permitido)', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      whatsappSenderNumber: '12345678'
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza teléfono con letras → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      whatsappSenderNumber: 'abc'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('Número');
  });

  // ─── Survey enabled but no URL ──────────────────────────────────────────────
  it('rechaza encuesta habilitada sin URL → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      satisfactionSurveyEnabled: true,
      satisfactionSurveyUrl: ''
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('enlace');
  });

  // ─── Broken unicode in template ─────────────────────────────────────────────
  it('rechaza template con unicode roto (\\ufffd) → mensaje específico', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      whatsappDefaultTemplate: 'Hola \ufffd mundo'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('caracteres inválidos');
  });

  // ─── Optional fields can be empty ───────────────────────────────────────────
  it('permite whatsappSenderNumber vacío → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      whatsappSenderNumber: ''
    });
    expect(result.ok).toBe(true);
  });

  it('permite businessPhone vacío → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      businessPhone: ''
    });
    expect(result.ok).toBe(true);
  });

  it('permite businessEmail vacío → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      businessEmail: ''
    });
    expect(result.ok).toBe(true);
  });

  // ─── Bank transfer fields ───────────────────────────────────────────────────
  it('valida CBU válido de 22 dígitos → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankCbu: '4530000800018342656744',
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza CBU con menos de 22 dígitos → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankCbu: '453000080001834265674',
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('22 dígitos');
  });

  it('rechaza CBU con letras → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankCbu: '45300008000183426567AA',
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('22 dígitos');
  });

  it('valida alias de 3 caracteres → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankAlias: 'abc',
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(true);
  });

  it('valida alias de 60 caracteres → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankAlias: 'a'.repeat(60),
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza alias de menos de 3 caracteres → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankAlias: 'ab',
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('3 y 60');
  });

  it('rechaza alias de más de 60 caracteres → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankAlias: 'a'.repeat(61),
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('3 y 60');
  });

  it('valida titular de 5 caracteres → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankAccountHolder: 'Juan',
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza titular de menos de 3 caracteres → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankAccountHolder: 'Ju',
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('muy corto');
  });

  it('valida titular de 3 o más caracteres → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankAccountHolder: 'Juan',
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(true);
  });

  it('rechaza proveedor vacío → inválido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankProvider: ''
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.join(' ')).toContain('Proveedor');
  });

  it('permite CBU vacío cuando hay otros campos vacíos → válido', () => {
    const result = validateAndNormalizeSettings({
      ...toFormValuesFromSettings(defaultSettings),
      bankCbu: '',
      bankAlias: '',
      bankAccountHolder: '',
      bankProvider: 'Naranja X'
    });
    expect(result.ok).toBe(true);
  });
});

describe('readSettingsFormValues', () => {
  it('lee todos los campos del FormData correctamente', () => {
    const formData = new FormData();
    formData.set('mealPlanMarginPercent', '20');
    formData.set('budgetValidityDays', '7');
    formData.set('businessName', 'Mi Negocio');
    formData.set('businessEmail', 'test@test.com');
    formData.set('whatsappSenderNumber', '+54911');

    const values = readSettingsFormValues(formData);

    expect(values.mealPlanMarginPercent).toBe('20');
    expect(values.budgetValidityDays).toBe('7');
    expect(values.businessName).toBe('Mi Negocio');
    expect(values.businessEmail).toBe('test@test.com');
    expect(values.whatsappSenderNumber).toBe('+54911');
  });

  it('convierte booleano "on" → true, null → false', () => {
    const formData = new FormData();
    formData.set('enableWhatsappNotifications', 'on');
    // satisfactionSurveyEnabled no está seteado → null

    const values = readSettingsFormValues(formData);

    expect(values.enableWhatsappNotifications).toBe(true);
    expect(values.satisfactionSurveyEnabled).toBe(false);
  });

  it('campos faltantes retornan empty string o false', () => {
    const formData = new FormData();

    const values = readSettingsFormValues(formData);

    expect(values.mealPlanMarginPercent).toBe('');
    expect(values.businessName).toBe('');
    expect(values.enableWhatsappNotifications).toBe(false);
  });

  it('recorta espacios en campos de texto', () => {
    const formData = new FormData();
    formData.set('businessName', '  Mi Negocio  ');
    formData.set('whatsappDefaultTemplate', '  Template  ');

    const values = readSettingsFormValues(formData);

    expect(values.businessName).toBe('Mi Negocio');
    expect(values.whatsappDefaultTemplate).toBe('Template');
  });
});

describe('toFormValuesFromSettings', () => {
  it('convierte margin 0.2 → "20" (porcentaje)', () => {
    const values = toFormValuesFromSettings({
      ...defaultSettings,
      meal_plan_margin: 0.2
    });
    expect(values.mealPlanMarginPercent).toBe('20');
  });

  it('convierte margin 0 → "0"', () => {
    const values = toFormValuesFromSettings({
      ...defaultSettings,
      meal_plan_margin: 0
    });
    expect(values.mealPlanMarginPercent).toBe('0');
  });

  it('convierte null optional fields → empty string', () => {
    const values = toFormValuesFromSettings({
      ...defaultSettings,
      whatsapp_sender_number: null,
      business_phone: null,
      business_email: null
    });

    expect(values.whatsappSenderNumber).toBe('');
    expect(values.businessPhone).toBe('');
    expect(values.businessEmail).toBe('');
  });

  it('round-trip: form → save → load preserva valores', () => {
    const originalSettings = {
      ...defaultSettings,
      meal_plan_margin: 0.24,
      budget_validity_days: 14,
      max_dogs_per_budget: 6,
      whatsapp_sender_number: '+5491112345678',
      whatsapp_default_template: 'Hola {{tutor_nombre}}',
      whatsapp_signature: 'Equipo REAL',
      enable_whatsapp_notifications: true,
      business_name: 'Mi Negocio',
      satisfaction_survey_enabled: true,
      satisfaction_survey_url: 'https://example.com/survey',
      satisfaction_survey_message: '¿Cómo fue tu experiencia?',
      bank_cbu: '4530000800018342656744',
      bank_alias: 'REAL.ALIMENTO2',
      bank_account_holder: 'Maylin Martinez Muñoz',
      bank_provider: 'Naranja X'
    };

    // Load → form values
    const formValues = toFormValuesFromSettings(originalSettings);

    // Validate → payload
    const result = validateAndNormalizeSettings(formValues);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Verify key fields preserved
    expect(result.payload.meal_plan_margin).toBe(0.24);
    expect(result.payload.budget_validity_days).toBe(14);
    expect(result.payload.max_dogs_per_budget).toBe(6);
    expect(result.payload.whatsapp_sender_number).toBe('+5491112345678');
    expect(result.payload.whatsapp_default_template).toBe('Hola {{tutor_nombre}}');
    expect(result.payload.whatsapp_signature).toBe('Equipo REAL');
    expect(result.payload.enable_whatsapp_notifications).toBe(true);
    expect(result.payload.business_name).toBe('Mi Negocio');
    expect(result.payload.satisfaction_survey_enabled).toBe(true);
    expect(result.payload.satisfaction_survey_url).toBe('https://example.com/survey');
    expect(result.payload.satisfaction_survey_message).toBe('¿Cómo fue tu experiencia?');
  });
});
