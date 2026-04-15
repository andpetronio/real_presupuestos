import { describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';

describe('(app)/veterinaries/[veterinary_id]/update load', () => {
  it('retorna veterinaria cuando existe', async () => {
    const eq = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'v-1', name: 'Vet Norte' }, error: null })
    });
    const select = vi.fn().mockReturnValue({ eq });

    const data = (await load({
      params: { veterinary_id: 'v-1' },
      locals: { supabase: { from: vi.fn().mockReturnValue({ select }) } }
    } as unknown as Parameters<typeof load>[0])) as { veterinary: { id: string } };

    expect(data.veterinary.id).toBe('v-1');
  });
});

describe('(app)/veterinaries/[veterinary_id]/update actions.update', () => {
  it('actualiza veterinaria y redirige al listado', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });

    const formData = new FormData();
    formData.set('name', 'Vet Centro');

    await expect(
      actions.update({
        params: { veterinary_id: 'v-1' },
        request: { formData: async () => formData },
        locals: { supabase: { from: vi.fn().mockReturnValue({ update }) } }
      } as unknown as Parameters<(typeof actions)['update']>[0])
    ).rejects.toMatchObject({ status: 303, location: '/veterinaries' });

    expect(update).toHaveBeenCalledWith({ name: 'Vet Centro' });
    expect(eq).toHaveBeenCalledWith('id', 'v-1');
  });
});
