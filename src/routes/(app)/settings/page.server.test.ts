import { describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';

describe('(app)/settings/+page.server load', () => {
  it('retorna success con configuración extendida', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        meal_plan_margin: 0.2,
        budget_validity_days: 10,
        vacuum_bag_small_unit_cost: 100,
        vacuum_bag_large_unit_cost: 180,
        label_unit_cost: 50,
        non_woven_bag_unit_cost: 70,
        labor_hour_cost: 3000,
        cooking_hour_cost: 3200,
        calcium_unit_cost: 5000,
        kefir_unit_cost: 5000,
        delivery_logistics_cost: 800,
        default_requested_days: 30,
        minimum_advance_days: 2,
        max_dogs_per_budget: 5,
        whatsapp_sender_number: '+5491122334455',
        whatsapp_default_template: 'Hola',
        whatsapp_signature: 'Equipo',
        enable_whatsapp_notifications: true,
        business_name: 'Pupi Chef',
        business_phone: '+5491133344455',
        business_email: 'hola@pupi.test',
        timezone_label: 'America/Argentina/Buenos_Aires',
        auto_expire_budgets: true,
        show_unit_costs_in_preview: false,
        require_internal_notes: false,
        satisfaction_survey_enabled: true,
        satisfaction_survey_url: 'https://example.com/survey',
        satisfaction_survey_message: 'Contanos cómo salió todo'
      },
      error: null
    });

    const data = (await load({
      locals: {
        supabase: {
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({ single })
            })
          })
        }
      }
    } as unknown as Parameters<typeof load>[0])) as { formState: string; settings: { budget_validity_days: number } };

    expect(data.formState).toBe('success');
    expect(data.settings.budget_validity_days).toBe(10);
  });
});

describe('(app)/settings/+page.server actions.update', () => {
  const baseSettingsRow = {
    meal_plan_margin: 0.2,
    budget_validity_days: 10,
    vacuum_bag_small_unit_cost: 100,
    vacuum_bag_large_unit_cost: 180,
    label_unit_cost: 50,
    non_woven_bag_unit_cost: 70,
    labor_hour_cost: 3000,
    cooking_hour_cost: 3200,
    calcium_unit_cost: 5000,
    kefir_unit_cost: 5000,
    delivery_logistics_cost: 800,
    default_requested_days: 30,
    minimum_advance_days: 2,
    max_dogs_per_budget: 5,
    whatsapp_sender_number: '+5491122334455',
    whatsapp_default_template: 'Hola',
    whatsapp_signature: 'Equipo',
    enable_whatsapp_notifications: true,
    business_name: 'Pupi Chef',
    business_phone: '+5491133344455',
    business_email: 'hola@pupi.test',
    timezone_label: 'America/Argentina/Buenos_Aires',
    auto_expire_budgets: true,
    show_unit_costs_in_preview: false,
    require_internal_notes: false,
    satisfaction_survey_enabled: true,
    satisfaction_survey_url: 'https://example.com/survey',
    satisfaction_survey_message: 'Contanos cómo salió todo'
  };

  const createSupabaseMock = () => {
    const single = vi.fn().mockResolvedValue({ data: baseSettingsRow, error: null });
    const upsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ single })
      }),
      upsert
    });

    return { from, upsert };
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.set('mealPlanMarginPercent', '20');
    formData.set('budgetValidityDays', '10');
    formData.set('vacuumBagSmallUnitCost', '100');
    formData.set('vacuumBagLargeUnitCost', '180');
    formData.set('labelUnitCost', '50');
    formData.set('nonWovenBagUnitCost', '70');
    formData.set('laborHourCost', '3000');
    formData.set('cookingHourCost', '3200');
    formData.set('calciumUnitCost', '5000');
    formData.set('kefirUnitCost', '5000');
    formData.set('deliveryLogisticsCost', '800');
    formData.set('defaultRequestedDays', '30');
    formData.set('minimumAdvanceDays', '2');
    formData.set('maxDogsPerBudget', '5');
    formData.set('whatsappSenderNumber', '+5491122334455');
    formData.set('whatsappDefaultTemplate', 'Hola {{nombre}}');
    formData.set('whatsappSignature', 'Equipo');
    formData.set('enableWhatsappNotifications', 'on');
    formData.set('businessName', 'Pupi Chef');
    formData.set('businessPhone', '+5491133344455');
    formData.set('businessEmail', 'hola@pupi.test');
    formData.set('timezoneLabel', 'America/Argentina/Buenos_Aires');
    formData.set('autoExpireBudgets', 'on');
    formData.set('showUnitCostsInPreview', 'on');
    formData.set('requireInternalNotes', 'on');
    formData.set('satisfactionSurveyEnabled', 'on');
    formData.set('satisfactionSurveyUrl', 'https://example.com/survey');
    formData.set('satisfactionSurveyMessage', 'Tu opinión nos ayuda');
    return formData;
  };

  it('guarda configuración válida en Supabase', async () => {
    const { from, upsert } = createSupabaseMock();
    const formData = buildFormData();
    formData.set('settingsSection', 'comercial');

    const result = (await actions.update({
      request: { formData: async () => formData },
      locals: {
        supabase: {
          from
        }
      }
    } as unknown as Parameters<(typeof actions)['update']>[0])) as { operatorSuccess: string };

    expect(upsert).toHaveBeenCalled();
    const payload = upsert.mock.calls[0][0] as { meal_plan_margin: number; satisfaction_survey_enabled: boolean };
    expect(payload.meal_plan_margin).toBe(0.2);
    expect(payload.satisfaction_survey_enabled).toBe(true);
    expect(result.operatorSuccess).toContain('guardada');
  });

  it('falla validación cuando se activa encuesta sin URL', async () => {
    const { from } = createSupabaseMock();
    const formData = buildFormData();
    formData.set('settingsSection', 'encuesta');
    formData.set('satisfactionSurveyUrl', '');

    const result = (await actions.update({
      request: { formData: async () => formData },
      locals: {
        supabase: {
          from
        }
      }
    } as unknown as Parameters<(typeof actions)['update']>[0])) as {
      status: number;
      data: { operatorError: string; fieldErrors: ReadonlyArray<string> };
    };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain('corregir');
    expect(result.data.fieldErrors.join(' ')).toContain('encuesta');
  });

  it('permite editar WhatsApp sin validar campos de otras secciones', async () => {
    const { from, upsert } = createSupabaseMock();
    const formData = new FormData();
    formData.set('settingsSection', 'whatsapp');
    formData.set('businessName', 'Pupi Chef');
    formData.set('timezoneLabel', 'America/Argentina/Buenos_Aires');
    formData.set('businessPhone', '+5491133344455');
    formData.set('businessEmail', 'hola@pupi.test');
    formData.set('whatsappDefaultTemplate', 'Hola {{tutor_nombre}}');
    formData.set('enableWhatsappNotifications', 'on');

    const result = (await actions.update({
      request: { formData: async () => formData },
      locals: {
        supabase: {
          from
        }
      }
    } as unknown as Parameters<(typeof actions)['update']>[0])) as { operatorSuccess: string };

    expect(result.operatorSuccess).toContain('guardada');
    expect(upsert).toHaveBeenCalled();
    const payload = upsert.mock.calls[0][0] as { meal_plan_margin: number; whatsapp_default_template: string };
    expect(payload.meal_plan_margin).toBe(0.2);
    expect(payload.whatsapp_default_template).toBe('Hola {{tutor_nombre}}');
  });
});
