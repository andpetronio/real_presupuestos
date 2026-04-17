/**
 * Formatea un valor numérico como moneda argentina (ARS).
 * Siempre 2 decimales, con símbolo "$" y formato es-AR.
 */
export const formatArs = (value: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Formatea un valor numérico (g, ml, etc.) con separador de miles.
 * La unidad de medida va SEPARADA en el template.
 *
 * Reglas:
 * - Si los decimales son todos cero → sin parte decimal (ej: 1000 → "1.000")
 * - Caso contrario → exactamente 2 decimales (ej: 1234.567 → "1.234,57")
 */
export const formatQuantity = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  const isWhole = Math.abs(rounded - Math.round(value)) < 1e-9;

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(value);
};
