export type FormShellState = 'idle' | 'saving' | 'validation' | 'error' | 'success';

/**
 * SvelteKit form action state compatible with PageData['form']
 */
export type EnhancedFormState =
  | {
      state: 'idle';
    }
  | {
      state: 'success';
      message?: string;
    }
  | {
      state: 'error';
      message?: string;
      errors?: Record<string, string[]>;
    };

/**
 * Check if a SvelteKit EnhancedFormState represents an error state
 */
export const isFormError = (form: EnhancedFormState | undefined | null): boolean => {
  return form?.state === 'error';
};

/**
 * Check if a SvelteKit EnhancedFormState represents a success state
 */
export const isFormSuccess = (form: EnhancedFormState | undefined | null): boolean => {
  return form?.state === 'success';
};

export const resolveFormShellMessage = (state: FormShellState, message?: string): string => {
  if (message) return message;

  if (state === 'saving') return 'Guardando…';
  if (state === 'validation') return 'Revisá los campos obligatorios antes de continuar.';
  if (state === 'error') return 'No se pudo guardar. Reintentá y verificá los datos.';
  if (state === 'success') return 'Cambios guardados correctamente.';

  return '';
};

export const resolvePrimaryActionDisabled = (
  state: FormShellState,
  disablePrimary: boolean
): boolean => {
  return disablePrimary || state === 'saving';
};

export const resolvePrimaryLabel = (state: FormShellState, primaryLabel: string): string => {
  if (state === 'saving') return 'Guardando…';
  return primaryLabel;
};
