import { describe, expect, it } from 'vitest';
import {
  resolveFormShellMessage,
  resolvePrimaryActionDisabled,
  resolvePrimaryLabel
} from './form-shell.model';

describe('form-shell.model', () => {
  it('resuelve mensajes por estado de formulario', () => {
    expect(resolveFormShellMessage('idle')).toBe('');
    expect(resolveFormShellMessage('saving')).toBe('Guardando…');
    expect(resolveFormShellMessage('validation')).toBe(
      'Revisá los campos obligatorios antes de continuar.'
    );
    expect(resolveFormShellMessage('error')).toBe('No se pudo guardar. Reintentá y verificá los datos.');
    expect(resolveFormShellMessage('success')).toBe('Cambios guardados correctamente.');
  });

  it('prioriza mensaje explícito por encima del estado', () => {
    expect(resolveFormShellMessage('error', 'Mensaje custom')).toBe('Mensaje custom');
  });

  it('resuelve deshabilitado de acción primaria según estado y flag', () => {
    expect(resolvePrimaryActionDisabled('idle', false)).toBe(false);
    expect(resolvePrimaryActionDisabled('saving', false)).toBe(true);
    expect(resolvePrimaryActionDisabled('success', true)).toBe(true);
  });

  it('resuelve label de acción primaria según estado', () => {
    expect(resolvePrimaryLabel('idle', 'Guardar cambios')).toBe('Guardar cambios');
    expect(resolvePrimaryLabel('saving', 'Guardar cambios')).toBe('Guardando…');
  });
});
