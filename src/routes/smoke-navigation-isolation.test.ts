import { describe, expect, it } from 'vitest';
import { navItems } from '$lib/constants/navigation';
import sidebarSource from '$lib/components/admin/SidebarNav.svelte?raw';

const publicRouteModules = import.meta.glob('./budget-response/[token]/+page.svelte');

describe('smoke: navegación admin e aislamiento público', () => {
  it('mantiene rutas del menú dentro de módulos internos', () => {
    const hrefs = navItems.map((item) => item.href);

    expect(hrefs).toEqual([
      '/dashboard',
      '/budgets',
      '/tutors',
      '/veterinaries',
      '/dogs',
      '/recipes',
      '/raw-materials',
      '/seguimiento',
      '/settings'
    ]);
    expect(hrefs.some((href) => href.includes('budget-response'))).toBe(false);
  });

  it('expone una ruta pública tokenizada fuera del grupo (app)', () => {
    expect(Object.keys(publicRouteModules)).toHaveLength(1);
  });

  it('conserva navegación keyboard-friendly en SidebarNav (anchors + aria-current)', () => {
    expect(sidebarSource).toContain('<a');
    expect(sidebarSource).toContain('aria-current');
    expect(sidebarSource).toContain('onclick={() => onNavigate?.(item)}');
  });
});
