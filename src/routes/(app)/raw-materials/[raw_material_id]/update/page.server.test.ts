import { describe, expect, it, vi } from 'vitest';
import { actions } from './+page.server';

describe('(app)/raw-materials/[raw_material_id]/update actions.update', () => {
  it('actualiza materia prima y redirige', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const formData = new FormData();
    formData.set('name', 'Pollo');
    formData.set('baseUnit', 'g');
    formData.set('purchaseQuantity', '1000');
    formData.set('baseCost', '2000');
    formData.set('wastagePercentage', '30');

    await expect(
      actions.update({
        params: { raw_material_id: 'rm-1' },
        request: { formData: async () => formData },
        locals: { supabase: { from: vi.fn().mockReturnValue({ update }) } }
      } as unknown as Parameters<(typeof actions)['update']>[0])
    ).rejects.toMatchObject({ status: 303, location: '/raw-materials' });

    expect(update).toHaveBeenCalledWith({
      name: 'Pollo',
      base_unit: 'g',
      purchase_quantity: 1000,
      base_cost: 2000,
      wastage_percentage: 30,
      cost_with_wastage: 2600,
      purchase_unit: 'g',
      purchase_cost: 2000,
      derived_unit_cost: 2.6
    });
    expect(eq).toHaveBeenCalledWith('id', 'rm-1');
  });
});
