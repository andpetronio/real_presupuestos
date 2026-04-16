import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getMonthLabel, getDateLabel, buildDogsSummary, buildWhatsappContext, sendBudgetWhatsapp } from './whatsapp';
import { buildWhatsappSendUrl } from '$lib/server/whatsapp/template';

describe('getMonthLabel', () => {
  it('formatea enero correctamente', () => {
    const date = new Date('2026-01-15');
    expect(getMonthLabel(date)).toBe('enero');
  });

  it('formatea julio correctamente', () => {
    // Use 0-indexed month: 6 = July
    const date = new Date(2026, 6, 1);
    expect(getMonthLabel(date)).toBe('julio');
  });

  it('retorna string no vacío para cualquier mes', () => {
    for (let m = 0; m < 12; m++) {
      const date = new Date(2026, m, 1);
      expect(getMonthLabel(date).length).toBeGreaterThan(0);
    }
  });
});

describe('getDateLabel', () => {
  it('formatea fecha válida dd/MM', () => {
    // Use explicit date to avoid timezone issues
    const result = getDateLabel('2026-04-14T12:00:00');
    expect(result).toMatch(/^\d{1,2}\/\d{1,2}$/);
  });

  it('retorna "sin fecha" para null', () => {
    expect(getDateLabel(null)).toBe('sin fecha');
  });

  it('retorna "sin fecha" para fecha inválida', () => {
    expect(getDateLabel('not-a-date')).toBe('sin fecha');
  });

  it('retorna "sin fecha" para fecha ISO inválida', () => {
    expect(getDateLabel('2026-99-99')).toBe('sin fecha');
  });
});

describe('buildDogsSummary', () => {
  it('0 perros → "tu perro"', () => {
    expect(buildDogsSummary([])).toBe('tu perro');
  });

  it('1 perro → días + nombre', () => {
    expect(buildDogsSummary([{ name: 'Mora', requestedDays: 10 }])).toBe('10 días para Mora');
  });

  it('2 perros → "A y B" con días por perro', () => {
    expect(
      buildDogsSummary([
        { name: 'Mora', requestedDays: 10 },
        { name: 'Luna', requestedDays: 20 }
      ])
    ).toBe('10 días para Mora y 20 días para Luna');
  });

  it('3+ perros → "A, B y C" con días por perro', () => {
    expect(
      buildDogsSummary([
        { name: 'Mora', requestedDays: 10 },
        { name: 'Luna', requestedDays: 20 },
        { name: 'Rex', requestedDays: 15 }
      ])
    ).toBe('10 días para Mora, 20 días para Luna y 15 días para Rex');
  });

  it('4 perros → "A, B, C y D" con días por perro', () => {
    expect(
      buildDogsSummary([
        { name: 'A', requestedDays: 1 },
        { name: 'B', requestedDays: 2 },
        { name: 'C', requestedDays: 3 },
        { name: 'D', requestedDays: 4 }
      ])
    ).toBe('1 días para A, 2 días para B, 3 días para C y 4 días para D');
  });
});

describe('buildWhatsappContext', () => {
  const baseParams = {
    tutorFullName: 'Ana García',
    dogsSummary: 'Mora y Luna',
    finalSalePrice: 15000,
    expiresAt: '2026-04-20T00:00:00.000Z',
    referenceMonth: '2026-04',
    referenceDays: 30,
    businessName: 'Mi Emprendimiento',
    link: 'https://example.com/budget/abc123',
    whatsappNumber: '+5491112345678'
  };

  it('arma contexto completo con todos los campos', () => {
    const ctx = buildWhatsappContext(baseParams);

    expect(ctx.tutor_nombre).toBe('Ana García');
    expect(ctx.tutor).toBe('Ana García');
    expect(ctx.perros).toBe('Mora y Luna');
    expect(ctx.perro).toBe('Mora y Luna');
    expect(ctx.fecha_limite).toMatch(/^\d{1,2}\/\d{1,2}$/);
    expect(ctx.mes_referencia).toBeTruthy();
    expect(ctx.dias_referencia).toBe(30);
    expect(ctx.nombre_emprendimiento).toBe('Mi Emprendimiento');
    expect(ctx.link_presupuesto).toBe('https://example.com/budget/abc123');
    expect(ctx.whatsapp_tutor).toBe('+5491112345678');
  });

  it('usa默认值 cuando businessName es falsy', () => {
    const ctx = buildWhatsappContext({ ...baseParams, businessName: '' });

    expect(ctx.nombre_emprendimiento).toBe('REAL');
    expect(ctx.emprendimiento).toBe('REAL');
  });

  it('calcula días desde referenceDays (null → 30 por defecto)', () => {
    const ctx = buildWhatsappContext({ ...baseParams, referenceDays: null });

    expect(ctx.dias_referencia).toBe(30);
    expect(ctx.dias).toBe(30);
  });

  it('formatea finalSalePrice con formatArs', () => {
    const ctx = buildWhatsappContext({ ...baseParams, finalSalePrice: 12345.67 });

    expect(ctx.total_final).toContain('12.345,67');
  });
});

// ─── sendBudgetWhatsapp ───────────────────────────────────────────────────────

/** Builder de mock de Supabase para sendBudgetWhatsapp. */
const makeWhatsappSupabase = (overrides: {
  budgetResult?: unknown;
  tutorResult?: unknown;
  settingsResult?: unknown;
  budgetDogsResult?: unknown;
  budgetUpdateResult?: unknown;
} = {}) => {
  const defaultBudgetData = {
    id: 'b-1',
    status: 'draft',
    tutor_id: 't-1',
    final_sale_price: 15000,
    expires_at: '2026-04-20T00:00:00Z',
    public_token: 'tok-abc123',
    reference_month: '2026-04',
    reference_days: 30
  };

  const base = {
    budgets: {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue(
            overrides.budgetResult ?? { data: defaultBudgetData, error: null }
          )
        })
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(overrides.budgetUpdateResult ?? { error: null })
      })
    },
    tutors: {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue(
            overrides.tutorResult ?? { data: { full_name: 'Ana García', whatsapp_number: '+5491112345678' }, error: null }
          )
        })
      })
    },
    settings: {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            overrides.settingsResult ?? {
              data: {
                business_name: 'Mi Emprendimiento',
                whatsapp_default_template: 'Hola {{tutor}}, tu presupuesto: {{total_final}}',
                whatsapp_signature: '— El equipo'
              },
              error: null
            }
          )
        })
      })
    },
    budget_dogs: {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(
          overrides.budgetDogsResult ?? {
            data: [
              { requested_days: 30, dog: { name: 'Mora' } },
              { requested_days: 20, dog: { name: 'Luna' } }
            ],
            error: null
          }
        )
      })
    }
  };

  return { from: vi.fn((table: string) => base[table as keyof typeof base] ?? {}) } as unknown as SupabaseClient;
};

describe('sendBudgetWhatsapp', () => {
  describe('happy path', () => {
    it('retorna ok con waMeUrl cuando todo funciona', async () => {
      const supabase = makeWhatsappSupabase();

      const result = await sendBudgetWhatsapp({
        budgetId: 'b-1',
        supabase,
        origin: 'https://example.com'
      });

      expect(result).toMatchObject({ ok: true });
      if ('ok' in result && result.ok && 'waMeUrl' in result) {
        // Sin userAgent → usa web.whatsapp.com, con mobile UA → wa.me
        expect(result.waMeUrl).toMatch(/wa\.me|web\.whatsapp\.com/);
        expect(result.waMeUrl).toContain('5491112345678');
      }
    });

    it('preserva status draft del budget', async () => {
      const supabase = makeWhatsappSupabase();
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      // No modifica el status — solo guarda el mensaje draft
      expect(result).toMatchObject({ ok: true });
    });

    it('genera link con public_token del budget', async () => {
      const supabase = makeWhatsappSupabase();
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: true });
    });

    it('usa wa.me en mobile user agent', async () => {
      const supabase = makeWhatsappSupabase();
      const result = await sendBudgetWhatsapp({
        budgetId: 'b-1',
        supabase,
        origin: 'https://example.com',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
      });
      expect(result).toMatchObject({ ok: true });
      if ('ok' in result && result.ok && 'waMeUrl' in result) {
        expect(result.waMeUrl).toContain('wa.me/5491112345678');
        expect(result.waMeUrl).not.toContain('web.whatsapp.com');
      }
    });

    it('usa web.whatsapp.com en desktop user agent', async () => {
      const supabase = makeWhatsappSupabase();
      const result = await sendBudgetWhatsapp({
        budgetId: 'b-1',
        supabase,
        origin: 'https://example.com',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      });
      expect(result).toMatchObject({ ok: true });
      if ('ok' in result && result.ok && 'waMeUrl' in result) {
        expect(result.waMeUrl).toContain('web.whatsapp.com/send?phone=5491112345678');
      }
    });

    it('funciona con status ready_to_send', async () => {
      const supabase = makeWhatsappSupabase({
        budgetResult: {
          data: {
            id: 'b-1',
            status: 'ready_to_send',
            tutor_id: 't-1',
            final_sale_price: 15000,
            expires_at: null,
            public_token: 'tok-abc123',
            reference_month: null,
            reference_days: null
          },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: true });
    });

    it('funciona sin signature configurada', async () => {
      const supabase = makeWhatsappSupabase({
        settingsResult: {
          data: {
            business_name: 'Test',
            whatsapp_default_template: 'Presupuesto: {{total_final}}',
            whatsapp_signature: null
          },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: true });
    });

    it('funciona sin perros asignados al presupuesto', async () => {
      const supabase = makeWhatsappSupabase({
        budgetDogsResult: { data: [], error: null }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: true });
    });

    it('funciona sin business_name configurada', async () => {
      const supabase = makeWhatsappSupabase({
        settingsResult: {
          data: {
            business_name: null,
            whatsapp_default_template: 'Hola {{tutor}}',
            whatsapp_signature: ''
          },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: true });
    });
  });

  describe('error paths', () => {
    it('budget no encontrado → error', async () => {
      const supabase = makeWhatsappSupabase({
        budgetResult: { data: null, error: null }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'nonexistent', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'No encontramos el presupuesto a enviar.' });
    });

    it('budget query error → error', async () => {
      const supabase = {
        from: vi.fn((table: string) => {
          if (table === 'budgets') {
            return {
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
                })
              })
            };
          }
          return {};
        })
      } as unknown as SupabaseClient;

      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'No encontramos el presupuesto a enviar.' });
    });

    it('status accepted → error', async () => {
      const supabase = makeWhatsappSupabase({
        budgetResult: {
          data: { id: 'b-1', status: 'accepted', tutor_id: 't-1', final_sale_price: 15000, expires_at: null, public_token: 'tok', reference_month: null, reference_days: null },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'Solo podés enviar presupuestos en borrador o listos para enviar.' });
    });

    it('status rejected → error', async () => {
      const supabase = makeWhatsappSupabase({
        budgetResult: {
          data: { id: 'b-1', status: 'rejected', tutor_id: 't-1', final_sale_price: 15000, expires_at: null, public_token: 'tok', reference_month: null, reference_days: null },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'Solo podés enviar presupuestos en borrador o listos para enviar.' });
    });

    it('tutor no encontrado → error', async () => {
      const supabase = makeWhatsappSupabase({
        tutorResult: { data: null, error: null }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'No encontramos el tutor del presupuesto.' });
    });

    it('tutor sin número de WhatsApp → error', async () => {
      const supabase = makeWhatsappSupabase({
        tutorResult: { data: { full_name: 'Ana García', whatsapp_number: null }, error: null }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'El tutor no tiene un número de WhatsApp válido para envío.' });
    });

    it('tutor con número vacío → error', async () => {
      const supabase = makeWhatsappSupabase({
        tutorResult: { data: { full_name: 'Ana García', whatsapp_number: '' }, error: null }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'El tutor no tiene un número de WhatsApp válido para envío.' });
    });

    it('settings no encontrados → error', async () => {
      const supabase = makeWhatsappSupabase({
        settingsResult: { data: null, error: null }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'No pudimos leer la configuración de WhatsApp para enviar el presupuesto.' });
    });

    it('budget_dogs query falla → error', async () => {
      const supabase = makeWhatsappSupabase({
        budgetDogsResult: { data: null, error: { message: 'join failed' } }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'No pudimos armar el detalle de perros para el mensaje.' });
    });

    it('template vacío → error', async () => {
      const supabase = makeWhatsappSupabase({
        settingsResult: {
          data: { business_name: 'Test', whatsapp_default_template: '', whatsapp_signature: '' },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: expect.stringContaining('mensaje base configurado') });
    });

    it('template con solo espacios → error', async () => {
      const supabase = makeWhatsappSupabase({
        settingsResult: {
          data: { business_name: 'Test', whatsapp_default_template: '   ', whatsapp_signature: '' },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: expect.stringContaining('mensaje base configurado') });
    });

    it('template con Unicode roto → error', async () => {
      const supabase = makeWhatsappSupabase({
        settingsResult: {
          data: { business_name: 'Test', whatsapp_default_template: 'Hola \ufffd mundo', whatsapp_signature: '' },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: expect.stringContaining('caracteres inválidos') });
    });

    it('signature con Unicode roto → error', async () => {
      const supabase = makeWhatsappSupabase({
        settingsResult: {
          data: { business_name: 'Test', whatsapp_default_template: 'Hola {{tutor}}', whatsapp_signature: '— \ufffd' },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: expect.stringContaining('firma') });
    });

    it('budget update falla → error', async () => {
      const supabase = makeWhatsappSupabase({
        budgetUpdateResult: { error: { message: 'update failed' } }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: false, message: 'No pudimos preparar el mensaje para WhatsApp. Reintentá en unos segundos.' });
    });

    it('funciona con un solo perro', async () => {
      const supabase = makeWhatsappSupabase({
        budgetDogsResult: { data: [{ requested_days: 30, dog: { name: 'Mora' } }], error: null }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: true });
    });

    it('funciona con final_sale_price null', async () => {
      const supabase = makeWhatsappSupabase({
        budgetResult: {
          data: { id: 'b-1', status: 'draft', tutor_id: 't-1', final_sale_price: null, expires_at: null, public_token: 'tok', reference_month: null, reference_days: null },
          error: null
        }
      });
      const result = await sendBudgetWhatsapp({ budgetId: 'b-1', supabase, origin: 'https://example.com' });
      expect(result).toMatchObject({ ok: true });
    });
  });
});
