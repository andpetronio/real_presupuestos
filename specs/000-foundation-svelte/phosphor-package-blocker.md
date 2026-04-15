# Bloqueo técnico: `@phosphor-icons/svelte`

Fecha: 2026-04-12

## Contexto
- Spec/design requieren explícitamente `@phosphor-icons/svelte`.
- Se intentó migración real de dependencia para cumplir literal el contrato.

## Evidencia reproducible

Comando ejecutado:

```bash
npm install @phosphor-icons/svelte
```

Resultado:

```txt
npm ERR! code E404
npm ERR! 404 Not Found - GET https://registry.npmjs.org/@phosphor-icons%2fsvelte - Not found
npm ERR! 404 The requested resource '@phosphor-icons/svelte@*' could not be found
```

Verificación de paquetes disponibles relacionados:

```bash
npm view @phosphor-icons/core version   # => 2.1.1
npm view phosphor-svelte version        # => 3.1.0
```

## Mitigación aplicada (robusta, sin romper Phosphor-only)
1. Se centralizaron TODOS los íconos en un adapter local: `src/lib/icons/phosphor.ts`.
2. Componentes y navegación consumen solo el adapter (`$lib/icons/phosphor`).
3. El adapter reexporta exclusivamente desde `phosphor-svelte` (familia Phosphor).
4. Se agregó guardrail de test para evitar deriva a librerías no Phosphor:
   - `src/lib/icons/phosphor.test.ts`
   - `src/lib/constants/navigation.test.ts`

## Plan de salida del bloqueo
- Cuando exista `@phosphor-icons/svelte`, solo hay que cambiar el adapter `src/lib/icons/phosphor.ts` y mantener el resto del código intacto.
