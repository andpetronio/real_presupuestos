import { formatArs } from '$lib/shared/currency';

const doubleBracesPlaceholderRegex = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;
const singleBracesPlaceholderRegex = /{\s*([a-zA-Z0-9_]+)\s*}/g;

export type WhatsappTemplateContext = Record<string, string | number>;

export const containsBrokenUnicode = (text: string): boolean => text.includes('\uFFFD');

export const normalizeTemplateText = (text: string): string => text.normalize('NFC');

export const renderWhatsappTemplate = (template: string, context: WhatsappTemplateContext): string => {
  const resolveValue = (_match: string, key: string): string => {
    const value = context[key];
    if (value === undefined || value === null) return '';
    return String(value);
  };

  const renderedDoubleBraces = template.replace(doubleBracesPlaceholderRegex, resolveValue);
  return renderedDoubleBraces.replace(singleBracesPlaceholderRegex, resolveValue);
};

export const normalizeWhatsappNumber = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

const mobileWhatsappUserAgentRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export const buildWhatsappSendUrl = (params: {
  phone: string;
  message: string;
  userAgent?: string | null;
}): string => {
  const normalizedPhone = normalizeWhatsappNumber(params.phone);
  const encodedMessage = encodeURIComponent(normalizeTemplateText(params.message));
  const isMobile = Boolean(params.userAgent && mobileWhatsappUserAgentRegex.test(params.userAgent));

  if (isMobile) {
    return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
  }

  return `https://web.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedMessage}`;
};

export { formatArs };
