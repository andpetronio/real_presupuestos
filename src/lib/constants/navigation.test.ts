import { describe, expect, it } from 'vitest';
import { navItems } from './navigation';
import navigationSource from './navigation.ts?raw';

describe('navigation', () => {
  it('define módulos internos únicos con hrefs únicos', () => {
    const keys = navItems.map((item) => item.key);
    const hrefs = navItems.map((item) => item.href);

    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(navItems.every((item) => item.internalOnly)).toBe(true);
  });

  it('mantiene módulos esperados para el admin clásico', () => {
    expect(navItems.map((item) => item.key)).toEqual([
      'dashboard',
      'budgets',
      'tutors',
      'veterinaries',
      'dogs',
      'recipes',
      'raw-materials',
      'settings'
    ]);
  });

  it('usa iconografía Phosphor-only en el archivo de navegación', () => {
    expect(navigationSource).toContain("from '$lib/icons/phosphor'");
    expect(navigationSource).not.toMatch(/lucide|heroicons|fontawesome|tabler/i);
  });
});
