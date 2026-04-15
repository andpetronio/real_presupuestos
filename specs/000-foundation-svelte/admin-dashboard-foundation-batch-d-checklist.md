# Admin Dashboard Foundation — Batch D Checklist

## 4.4 Accesibilidad mínima + consistencia visual

- [x] **Focus visible** definido globalmente con `:focus-visible` y outline perceptible.
  - Evidencia: `src/app.css` líneas `54-57`.
- [x] **Contraste AA** validado en tests para pares principales (texto/superficies).
  - Evidencia: `src/lib/design/tokens.test.ts` (`contrastRatio >= 4.5`).
- [x] **Paleta obligatoria** restringida a `#01646D #E16A3D #81923D #000000 #FFFFFF #FFA45D`.
  - Evidencia: `src/lib/design/tokens.test.ts` (set estricto sobre `tokens`).
- [x] **Iconografía Phosphor-only** en navegación admin.
  - Evidencia: `src/lib/constants/navigation.test.ts` (`phosphor-svelte` y guard anti-otras librerías).
- [x] **Navegación keyboard-friendly** con anchors y estado activo accesible (`aria-current`).
  - Evidencia: `src/routes/smoke-navigation-isolation.test.ts` + `src/lib/components/admin/SidebarNav.svelte`.
- [x] **Aislamiento de rutas públicas tokenizadas** fuera del grupo `(app)`.
  - Evidencia: `src/routes/budget-response/[token]/+page.svelte` + smoke test.
