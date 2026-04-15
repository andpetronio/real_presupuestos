import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

describe('(app)/raw-materials/+page.server load', () => {
  it('retorna empty cuando no hay materias primas', async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });

    const data = (await load({
      locals: {
        supabase: {
          from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ order })
          })
        }
      },
      url: new URL('https://example.test/raw-materials')
    } as unknown as Parameters<typeof load>[0])) as { tableState: string };

    expect(data.tableState).toBe('empty');
  });
});
