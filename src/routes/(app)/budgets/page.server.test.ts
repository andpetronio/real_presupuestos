import { describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';

describe('(app)/budgets/+page.server load', () => {
  it('retorna success cuando hay datos base para formular presupuesto', async () => {
    const from = vi.fn((table: string) => {
      if (table === 'budgets') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'b-1',
                    status: 'draft',
                    tutor_id: 't-1',
                    notes: null,
                    final_sale_price: 1000,
                    total_cost: 900,
                    ingredient_total_global: 600,
                    operational_total_global: 300,
                    created_at: '2026-01-01',
                    expires_at: null,
                    tutor: { full_name: 'Ana' }
                  }
                ],
                count: 1,
                error: null
              })
            })
          })
        };
      }

      if (table === 'tutors') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              maybeCompressedDataAccess: vi.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          })
        };
      }

      return { select: vi.fn() };
    });

    const data = (await load({
      locals: { supabase: { from } },
      url: new URL('https://test.local/budgets')
    } as unknown as Parameters<typeof load>[0])) as {
      tableState: string;
      budgets: ReadonlyArray<unknown>;
      pagination: { page: number; totalPages: number; total: number };
      filters: { status: string; search: string; tutorId: string | null };
      tutors: unknown[];
      // Options are lazy-loaded only on new/update pages, not the table page.
    };

    expect(data.tableState).toBe('success');
    expect(data.budgets).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
    expect(data.tutors).toEqual([]);
  });

  it('carga filas de edicion desde budget_dogs y recetas anidadas', async () => {
    const from = vi.fn((table: string) => {
      if (table === 'budgets') {
        const baseBudget = {
          id: 'b-1',
          status: 'draft',
          tutor_id: 't-1',
          notes: null,
          vacuum_bag_small_qty: 1,
          vacuum_bag_large_qty: 2,
          labels_qty: 3,
          non_woven_bag_qty: 4,
          labor_hours_qty: 5,
          cooking_hours_qty: 6,
          calcium_qty: 7,
          kefir_qty: 8,
          final_sale_price: 1000,
          total_cost: 900,
          ingredient_total_global: 600,
          operational_total_global: 300,
          created_at: '2026-01-01',
          expires_at: null,
          tutor: { full_name: 'Ana' }
        };

        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn().mockResolvedValue({
                data: [baseBudget],
                count: 1,
                error: null
              })
            })),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: baseBudget, error: null })
            })
          }))
        };
      }

      if (table === 'budget_dogs') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    dog_id: 'd-1',
                    budget_dog_recipes: [
                      { recipe_id: 'r-1', assigned_days: 5 },
                      { recipe_id: 'r-2', assigned_days: 3 }
                    ]
                  }
                ],
                error: null
              })
            })
          })
        };
      }

      if (table === 'tutors') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        };
      }

      return { select: vi.fn() };
    });

    const data = (await load({
      locals: { supabase: { from } },
      url: new URL('https://test.local/budgets?edit=b-1')
    } as unknown as Parameters<typeof load>[0])) as {
      editingBudget: {
        vacuum_bag_small_qty?: number;
        vacuum_bag_large_qty?: number;
        labels_qty?: number;
        non_woven_bag_qty?: number;
        labor_hours_qty?: number;
        cooking_hours_qty?: number;
        calcium_qty?: number;
        kefir_qty?: number;
      } | null;
      editingRows: Array<{ dogId: string; recipeId: string; assignedDays: string }>;
    };

    expect(data.editingBudget).toMatchObject({
      vacuum_bag_small_qty: 1,
      vacuum_bag_large_qty: 2,
      labels_qty: 3,
      non_woven_bag_qty: 4,
      labor_hours_qty: 5,
      cooking_hours_qty: 6,
      calcium_qty: 7,
      kefir_qty: 8
    });

    expect(data.editingRows).toEqual([
      { dogId: 'd-1', recipeId: 'r-1', assignedDays: '5' },
      { dogId: 'd-1', recipeId: 'r-2', assignedDays: '3' }
    ]);
  });
});

describe('(app)/budgets/+page.server actions.create', () => {
  it('falla validación si no hay composición', async () => {
    const formData = new FormData();
    formData.set('tutorId', 't-1');
    formData.set('budgetMonth', '2026-04');
    formData.set('budgetDays', '30');

    const result = (await actions.create({
      request: { formData: async () => formData },
      locals: { supabase: { from: vi.fn() } }
    } as unknown as Parameters<(typeof actions)['create']>[0])) as {
      status: number;
      data: { operatorError: string };
    };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain('al menos una receta');
  });

  it('crea presupuesto con fórmula de costo + margen', async () => {
    const budgetInsertSingle = vi.fn().mockResolvedValue({ data: { id: 'b-1' }, error: null });
    const budgetInsertSelect = vi.fn().mockReturnValue({ single: budgetInsertSingle });
    const budgetsInsert = vi.fn().mockReturnValue({ select: budgetInsertSelect });

    const budgetDogsEq = vi.fn().mockResolvedValue({ error: null });
    const budgetDogsDelete = vi.fn().mockReturnValue({ eq: budgetDogsEq });
    const budgetDogsSelect = vi.fn().mockResolvedValue({ data: [{ id: 'bd-1', dog_id: 'd-1' }], error: null });
    const budgetDogsInsert = vi.fn().mockReturnValue({ select: budgetDogsSelect });

    const recipeItemsInsert = vi.fn().mockResolvedValue({ error: null });
    const snapshotInsert = vi.fn().mockResolvedValue({ error: null });

    const from = vi.fn((table: string) => {
      if (table === 'settings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValueOnce({
                  data: {
                    meal_plan_margin: 0.2,
                    vacuum_bag_small_unit_cost: 10,
                    vacuum_bag_large_unit_cost: 20,
                    label_unit_cost: 5,
                    non_woven_bag_unit_cost: 3,
                    labor_hour_cost: 100,
                    cooking_hour_cost: 120,
                    calcium_unit_cost: 5000,
                    kefir_unit_cost: 5000,
                    budget_validity_days: 7
                  },
                  error: null
                })
                .mockResolvedValueOnce({ data: { budget_validity_days: 7 }, error: null })
            })
          })
        };
      }

      if (table === 'dogs') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [{ id: 'd-1', tutor_id: 't-1' }], error: null })
          })
        };
      }

      if (table === 'recipes') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [{ id: 'r-1', dog_id: 'd-1' }], error: null })
          }),
          insert: budgetsInsert
        };
      }

      if (table === 'recipe_items') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  recipe_id: 'r-1',
                  daily_quantity: 100,
                  raw_material: { derived_unit_cost: 2, cost_with_wastage: 2000, purchase_quantity: 1000 }
                }
              ],
              error: null
            })
          })
        };
      }

      if (table === 'budgets') {
        return {
          insert: budgetsInsert
        };
      }

      if (table === 'budget_dogs') {
        return {
          delete: budgetDogsDelete,
          insert: budgetDogsInsert
        };
      }

      if (table === 'budget_dog_recipes') {
        return {
          insert: recipeItemsInsert
        };
      }

      if (table === 'budget_snapshots') {
        return {
          insert: snapshotInsert
        };
      }

      return {
        select: vi.fn()
      };
    });

    const formData = new FormData();
    formData.set('tutorId', 't-1');
    formData.set('budgetMonth', '2026-04');
    formData.set('budgetDays', '30');
    formData.append('rowDogId', 'd-1');
    formData.append('recipeId', 'r-1');
    formData.append('assignedDays', '3');
    formData.set('calciumQty', '1');
    formData.set('kefirQty', '1');

    const result = (await actions.create({
      request: { formData: async () => formData },
      locals: { supabase: { from } }
    } as unknown as Parameters<(typeof actions)['create']>[0])) as { operatorSuccess: string };

    expect(budgetsInsert).toHaveBeenCalled();
    const payload = budgetsInsert.mock.calls[0][0] as Record<string, number | string | null>;
    expect(payload.total_cost).toBe(10600);
    expect(payload.final_sale_price).toBe(13250);
    expect(recipeItemsInsert).toHaveBeenCalled();
    expect(snapshotInsert).toHaveBeenCalled();
    expect(result.operatorSuccess).toContain('creado');
  });

  it('abre wa.me con mensaje dinámico al enviar por WhatsApp', async () => {
    const budgetMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'b-1',
        status: 'draft',
        tutor_id: 't-1',
        final_sale_price: 12000,
        expires_at: '2026-05-20T00:00:00.000Z',
        public_token: 'token1234567890'
      },
      error: null
    });
    const tutorMaybeSingle = vi.fn().mockResolvedValue({
      data: { full_name: 'Ana Tutor', whatsapp_number: '+5491112345678' },
      error: null
    });
    const settingsSingle = vi.fn().mockResolvedValue({
      data: {
        business_name: 'REAL',
        whatsapp_default_template: 'Hola {{tutor_nombre}}, total {{total_final}} para {{perros}}. Link: {{link_presupuesto}}',
        whatsapp_signature: 'Equipo REAL',
        whatsapp_sender_number: '+5491199999999'
      },
      error: null
    });
    const budgetDogsEq = vi.fn().mockResolvedValue({
      data: [
        { requested_days: 30, dog: { name: 'Nanuk' } },
        { requested_days: 20, dog: { name: 'Logan' } }
      ],
      error: null
    });

    const budgetUpdateEq = vi.fn().mockResolvedValue({ error: null });
    const budgetUpdateSecondEq = vi.fn().mockResolvedValue({ error: null });
    const budgetUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: budgetUpdateSecondEq }) });

    const from = vi.fn((table: string) => {
      if (table === 'budgets') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: budgetMaybeSingle }) }),
          update: budgetUpdate
        };
      }

      if (table === 'tutors') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: tutorMaybeSingle }) })
        };
      }

      if (table === 'settings') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: settingsSingle }) })
        };
      }

      if (table === 'budget_dogs') {
        return {
          select: vi.fn().mockReturnValue({ eq: budgetDogsEq })
        };
      }

      return { select: vi.fn(), update: vi.fn() };
    });

    const formData = new FormData();
    formData.set('budgetId', 'b-1');

    await expect(
      actions.sendWhatsapp({
        request: { formData: async () => formData },
        url: new URL('https://test.local/budgets'),
        locals: { supabase: { from } }
      } as unknown as Parameters<(typeof actions)['sendWhatsapp']>[0])
    ).rejects.toMatchObject({
      status: 303,
      location: expect.stringContaining('https://web.whatsapp.com/send?phone=5491112345678&text=')
    });

    expect(budgetUpdate).toHaveBeenCalled();
    const updatePayload = budgetUpdate.mock.calls[0][0] as Record<string, string | null>;
    expect(updatePayload.whatsapp_message_draft).toContain('Ana Tutor');
    expect(updatePayload.whatsapp_message_draft).toContain('30 días para Nanuk y 20 días para Logan');
    expect(updatePayload.whatsapp_message_draft).toContain('https://test.local/budget-response/token1234567890');
    expect(updatePayload.whatsapp_message_sent).toBeNull();
  });

  it('falla envío cuando la firma tiene unicode roto', async () => {
    const budgetMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'b-1',
        status: 'draft',
        tutor_id: 't-1',
        final_sale_price: 12000,
        expires_at: '2026-05-20T00:00:00.000Z',
        public_token: 'token1234567890'
      },
      error: null
    });
    const tutorMaybeSingle = vi.fn().mockResolvedValue({
      data: { full_name: 'Ana Tutor', whatsapp_number: '+5491112345678' },
      error: null
    });
    const settingsSingle = vi.fn().mockResolvedValue({
      data: {
        business_name: 'REAL',
        whatsapp_default_template: 'Hola {{tutor_nombre}}',
        whatsapp_signature: 'Equipo �'
      },
      error: null
    });
    const budgetDogsEq = vi.fn().mockResolvedValue({ data: [{ requested_days: 30, dog: { name: 'Nanuk' } }], error: null });
    const budgetUpdate = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === 'budgets') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: budgetMaybeSingle }) }),
          update: budgetUpdate
        };
      }

      if (table === 'tutors') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: tutorMaybeSingle }) })
        };
      }

      if (table === 'settings') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: settingsSingle }) })
        };
      }

      if (table === 'budget_dogs') {
        return {
          select: vi.fn().mockReturnValue({ eq: budgetDogsEq })
        };
      }

      return { select: vi.fn(), update: vi.fn() };
    });

    const formData = new FormData();
    formData.set('budgetId', 'b-1');

    const result = (await actions.sendWhatsapp({
      request: { formData: async () => formData },
      url: new URL('https://test.local/budgets'),
      locals: { supabase: { from } }
    } as unknown as Parameters<(typeof actions)['sendWhatsapp']>[0])) as {
      status: number;
      data: { operatorError: string };
    };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain('La firma de WhatsApp tiene caracteres inválidos');
    expect(budgetUpdate).not.toHaveBeenCalled();
  });

  it('falla envío cuando el mensaje renderizado trae unicode roto', async () => {
    const budgetMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'b-1',
        status: 'draft',
        tutor_id: 't-1',
        final_sale_price: 12000,
        expires_at: '2026-05-20T00:00:00.000Z',
        public_token: 'token1234567890'
      },
      error: null
    });
    const tutorMaybeSingle = vi.fn().mockResolvedValue({
      data: { full_name: 'Ana �', whatsapp_number: '+5491112345678' },
      error: null
    });
    const settingsSingle = vi.fn().mockResolvedValue({
      data: {
        business_name: 'REAL',
        whatsapp_default_template: 'Hola {{tutor_nombre}}',
        whatsapp_signature: 'Equipo REAL'
      },
      error: null
    });
    const budgetDogsEq = vi.fn().mockResolvedValue({ data: [{ requested_days: 30, dog: { name: 'Nanuk' } }], error: null });
    const budgetUpdate = vi.fn();

    const from = vi.fn((table: string) => {
      if (table === 'budgets') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: budgetMaybeSingle }) }),
          update: budgetUpdate
        };
      }

      if (table === 'tutors') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: tutorMaybeSingle }) })
        };
      }

      if (table === 'settings') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: settingsSingle }) })
        };
      }

      if (table === 'budget_dogs') {
        return {
          select: vi.fn().mockReturnValue({ eq: budgetDogsEq })
        };
      }

      return { select: vi.fn(), update: vi.fn() };
    });

    const formData = new FormData();
    formData.set('budgetId', 'b-1');

    const result = (await actions.sendWhatsapp({
      request: { formData: async () => formData },
      url: new URL('https://test.local/budgets'),
      locals: { supabase: { from } }
    } as unknown as Parameters<(typeof actions)['sendWhatsapp']>[0])) as {
      status: number;
      data: { operatorError: string };
    };

    expect(result.status).toBe(400);
    expect(result.data.operatorError).toContain('mensaje generado para WhatsApp contiene caracteres inválidos');
    expect(budgetUpdate).not.toHaveBeenCalled();
  });
});
