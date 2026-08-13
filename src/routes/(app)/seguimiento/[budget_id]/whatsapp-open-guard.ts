type WhatsappActionResult = {
  data?: {
    whatsappUrl?: unknown;
  };
};

const openedResults = new WeakSet<object>();

export const readWhatsappUrl = (result: unknown): string | null => {
  if (!result || typeof result !== "object") return null;
  const data = (result as WhatsappActionResult).data;
  const url = data?.whatsappUrl;
  return typeof url === "string" && url.trim() ? url : null;
};

export const shouldOpenWhatsappForResult = (result: unknown): boolean => {
  if (!result || typeof result !== "object") return false;
  if (!readWhatsappUrl(result)) return false;
  if (openedResults.has(result)) return false;

  openedResults.add(result);
  return true;
};
