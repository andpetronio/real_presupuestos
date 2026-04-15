// @ts-nocheck
import { fail, redirect } from '@sveltejs/kit';
import { parseFormString, sanitizeInternalNext } from '$lib/server/auth/next';
import type { Actions, PageServerLoad } from './$types';

const LOGIN_ERROR_MESSAGE = 'No pudimos iniciar sesión. Verificá email y contraseña e intentá de nuevo.';
const LOGIN_INVALID_CREDENTIALS_MESSAGE = 'Credenciales inválidas. Revisá email y contraseña.';

const getOperatorLoginError = (errorMessage: string | undefined): string => {
  if (!errorMessage) return LOGIN_ERROR_MESSAGE;

  const normalized = errorMessage.toLowerCase();
  if (normalized.includes('invalid login credentials')) {
    return LOGIN_INVALID_CREDENTIALS_MESSAGE;
  }

  return LOGIN_ERROR_MESSAGE;
};

export const load = async ({ locals, url }: Parameters<PageServerLoad>[0]) => {
  const nextPath = sanitizeInternalNext(url.searchParams.get('next'));

  if (locals.user) {
    throw redirect(303, nextPath);
  }

  return {
    nextPath
  };
};

export const actions = {
  login: async ({ request, locals, url }: import('./$types').RequestEvent) => {
    const formData = await request.formData();
    const nextPath = sanitizeInternalNext(
      parseFormString(formData.get('next')) ?? url.searchParams.get('next')
    );
    const email = parseFormString(formData.get('email'))?.trim().toLowerCase() ?? '';
    const password = parseFormString(formData.get('password')) ?? '';

    if (!email || !password) {
      return fail(400, {
        operatorError: LOGIN_ERROR_MESSAGE,
        nextPath,
        email
      });
    }

    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return fail(400, {
        operatorError: getOperatorLoginError(error.message),
        nextPath,
        email
      });
    }

    throw redirect(303, nextPath);
  }
};
;null as any as Actions;