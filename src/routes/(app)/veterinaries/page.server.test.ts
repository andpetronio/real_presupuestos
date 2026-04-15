import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

describe('(app)/veterinaries/+page.server load', () => {
  it('retorna success cuando Supabase devuelve veterinarias', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: 'v-1', name: 'Vet Norte', created_at: '2026-01-01' }],
      error: null
    });

    const data = (await load({
      url: new URL('https://test.local/veterinaries'),
      locals: {
        supabase: {
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ order })
          })
        }
      }
    } as unknown as Parameters<typeof load>[0])) as { tableState: string; veterinaries: ReadonlyArray<unknown> };

    expect(data.tableState).toBe('success');
    expect(data.veterinaries).toHaveLength(1);
  });
});
