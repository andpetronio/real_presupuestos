import { describe, expect, it } from 'vitest';
import { buildWhatsappSendUrl, containsBrokenUnicode, normalizeTemplateText, renderWhatsappTemplate } from './template';

describe('containsBrokenUnicode', () => {
  it('detecta caracteres de reemplazo unicode', () => {
    expect(containsBrokenUnicode('Hola 😊')).toBe(false);
    expect(containsBrokenUnicode('Hola �')).toBe(true);
  });
});

describe('normalizeTemplateText', () => {
  it('normaliza a NFC para preservar emojis/acentos consistentes', () => {
    const normalized = normalizeTemplateText('Cafe\u0301 ☕');
    expect(normalized).toBe('Café ☕');
  });
});

describe('renderWhatsappTemplate', () => {
  it('soporta placeholders con dobles y simples llaves', () => {
    const template = 'Hola {{tutor_nombre}} / {perro}';
    const rendered = renderWhatsappTemplate(template, {
      tutor_nombre: 'Ana',
      perro: 'Nanuk'
    });

    expect(rendered).toBe('Hola Ana / Nanuk');
  });
});

describe('buildWhatsappSendUrl', () => {
  it('usa web.whatsapp.com por defecto en escritorio', () => {
    const url = buildWhatsappSendUrl({
      phone: '+54 9 11 1234 5678',
      message: 'Hola 🐶'
    });

    expect(url).toBe('https://web.whatsapp.com/send?phone=5491112345678&text=Hola%20%F0%9F%90%B6');
  });

  it('usa wa.me cuando detecta user agent móvil', () => {
    const url = buildWhatsappSendUrl({
      phone: '+54 9 11 1234 5678',
      message: 'Hola 🐶',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
    });

    expect(url).toBe('https://wa.me/5491112345678?text=Hola%20%F0%9F%90%B6');
  });
});
