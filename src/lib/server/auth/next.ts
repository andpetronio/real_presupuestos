const DEFAULT_INTERNAL_PATH = "/dashboard";

const normalizeCandidate = (
  value: string | null | undefined,
): string | null => {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const sanitizeInternalNext = (
  value: string | null | undefined,
): string => {
  const candidate = normalizeCandidate(value);

  if (!candidate) return DEFAULT_INTERNAL_PATH;
  if (!candidate.startsWith("/")) return DEFAULT_INTERNAL_PATH;
  if (candidate.startsWith("//")) return DEFAULT_INTERNAL_PATH;

  return candidate;
};

export const buildPublicLoginRedirect = (nextPath: string): string =>
  `/?next=${encodeURIComponent(sanitizeInternalNext(nextPath))}`;

export const parseFormString = (
  value: FormDataEntryValue | null,
): string | null => (typeof value === "string" ? value : null);
