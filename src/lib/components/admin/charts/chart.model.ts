/**
 * Formatea una etiqueta de bucket de fecha (YYYY-MM-DD → DD/MM).
 */
export const formatBucketLabel = (bucket: string): string => {
  const parts = bucket.split("-").map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return bucket;
  const [year, month, day] = parts;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
};

/**
 * Calcula promedio móvil simple (SMA) sobre un array de valores.
 * Window por defecto = 3.
 */
export const computeMovingAverage = (
  values: number[],
  window = 3,
): { raw: number; average: number }[] => {
  return values.map((value, index) => {
    const start = Math.max(0, index - (window - 1));
    const slice = values.slice(start, index + 1);
    const average = slice.reduce((a, b) => a + b, 0) / slice.length;
    return { raw: value, average };
  });
};
