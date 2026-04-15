import { describe, expect, it } from 'vitest';
import phosphorSource from './phosphor.ts?raw';

describe('phosphor icon adapter', () => {
  it('mantiene origen Phosphor-only en un único punto', () => {
    expect(phosphorSource).toContain("from 'phosphor-svelte'");
    expect(phosphorSource).not.toMatch(/lucide|heroicons|fontawesome|tabler/i);
  });
});
