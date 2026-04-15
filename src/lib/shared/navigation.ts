/**
 * Helpers de navegación tipados para componentes de página.
 *
 * Evitan el cast `as unknown as (path: string) => string` que se necesita
 * con `resolve` de `$app/paths` cuando se usa dentro de `$derived`.
 *
 * Uso:
 *   import { route } from '$lib/shared/navigation';
 *   const dogEditPath = route('/dogs/', dog.id, '/update');
 *
 *   // Para paths estáticos, usar constantes:
 *   const DOGS_PATH = '/dogs';
 */

/**
 * Construye un path concatenando segmentos. Cada segmento se convierte a string
 * y se unen con '/'. Elimina slashes duplicados.
 */
export const route = (...segments: (string | number | undefined | null)[]): string =>
  segments.filter((s): s is string | number => s != null).join('/').replace(/\/+/g, '/');
