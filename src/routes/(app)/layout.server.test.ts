import { describe, expect, it } from 'vitest';
import { navItems } from '$lib/constants/navigation';
import { load } from './+layout.server';

type TestEventInput = {
  userId?: string;
  pathname?: string;
  search?: string;
};

const createEvent = ({ userId, pathname = '/dashboard', search = '' }: TestEventInput) =>
  ({
    locals: {
      user: userId === undefined ? null : ({ id: userId } as { id: string }),
      supabase: {
        from: () => ({
          select: () => ({
            eq: () => ({
              is: async () => ({ count: 0, error: null })
            })
          })
        })
      }
    },
    url: new URL(`https://example.test${pathname}${search}`)
  }) as unknown as Parameters<typeof load>[0];

describe('(app)/+layout.server load', () => {
  it('acepta user autenticado desde locals y devuelve nav interna', async () => {
    const result = (await load(createEvent({ userId: '  user-123  ' }))) as {
      actorId: string;
      pendingAcceptedCount: number;
      navContext: ReadonlyArray<{ key: string; href: string; label: string }>;
    };

    expect(result.actorId).toBe('user-123');
    expect(result.pendingAcceptedCount).toBe(0);
    expect(result.navContext).toEqual(
      navItems.map(({ key, href, label }) => ({ key, href, label }))
    );
  });

  it('redirecciona al login público preservando next cuando no hay sesión', async () => {
    await expect(load(createEvent({ userId: '   ', pathname: '/budgets', search: '?q=ready' }))).rejects.toMatchObject({
      status: 303,
      location: '/?next=%2Fbudgets%3Fq%3Dready'
    });
  });

  it('ignora cookie admin_session para acceso interno sin user autenticado', async () => {
    await expect(load(createEvent({ userId: undefined }))).rejects.toMatchObject({
      status: 303,
      location: '/?next=%2Fdashboard'
    });
  });
});
