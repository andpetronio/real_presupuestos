import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { BudgetStatus } from '$lib/types/budget';

type PublicBudgetRow = {
  id: string;
  status: BudgetStatus;
  final_sale_price: number;
  expires_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  sent_at: string | null;
  tutor: { full_name: string } | Array<{ full_name: string }> | null;
};

const fallbackError = {
  kind: 'error' as const,
  title: 'No pudimos cargar este presupuesto',
  detail: 'Reintentá en unos segundos o pedile al equipo que te reenvíe el enlace.'
};

const activeResponseStatuses = new Set<BudgetStatus>(['draft', 'ready_to_send', 'sent']);

const parseText = (value: FormDataEntryValue | null): string =>
  typeof value === 'string' ? value.trim() : '';

const isPastDue = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false;
  const expiresDate = new Date(expiresAt);
  if (Number.isNaN(expiresDate.getTime())) return false;
  return expiresDate.getTime() <= Date.now();
};

const extractTutorName = (relation: PublicBudgetRow['tutor']): string => {
  if (!relation) return 'Sin tutor';
  if (Array.isArray(relation)) return relation[0]?.full_name ?? 'Sin tutor';
  return relation.full_name;
};

const readBudgetByToken = async (locals: App.Locals, token: string): Promise<PublicBudgetRow | null> => {
  const result = await locals.supabase
    .from('budgets')
    .select('id, status, final_sale_price, expires_at, notes, rejection_reason, accepted_at, rejected_at, sent_at, tutor:tutors(full_name)')
    .eq('public_token', token)
    .maybeSingle();

  if (result.error) throw result.error;
  return (result.data ?? null) as PublicBudgetRow | null;
};

const expireBudgetIfNeeded = async (locals: App.Locals, budget: PublicBudgetRow): Promise<PublicBudgetRow> => {
  if (!activeResponseStatuses.has(budget.status) || !isPastDue(budget.expires_at)) {
    return budget;
  }

  const { error } = await locals.supabase
    .from('budgets')
    .update({ status: 'expired' })
    .eq('id', budget.id)
    .in('status', Array.from(activeResponseStatuses));

  if (error) {
    return budget;
  }

  return {
    ...budget,
    status: 'expired'
  };
};

const getBlockedResponseMessage = (status: string): string => {
  if (status === 'accepted') return 'Este presupuesto ya fue aceptado. ¡Gracias por confirmarlo!';
  if (status === 'rejected') return 'Este presupuesto ya fue rechazado y no admite nuevas respuestas.';
  if (status === 'expired') return 'Este presupuesto venció y ya no puede responderse.';
  return 'Este presupuesto no admite respuesta en este momento.';
};

const mapPublicView = (budget: PublicBudgetRow) => ({
  id: budget.id,
  status: budget.status,
  finalSalePrice: Number(budget.final_sale_price ?? 0),
  expiresAt: budget.expires_at,
  notes: budget.notes,
  rejectionReason: budget.rejection_reason,
  acceptedAt: budget.accepted_at,
  rejectedAt: budget.rejected_at,
  sentAt: budget.sent_at,
  tutorName: extractTutorName(budget.tutor),
  canRespond: activeResponseStatuses.has(budget.status) && !isPastDue(budget.expires_at)
});

export const load: PageServerLoad = async ({ params, locals }) => {
  try {
    const token = params.token?.trim();
    if (!token) {
      return {
        budget: null,
        pageState: 'error' as const,
        pageMessage: {
          kind: 'error' as const,
          title: 'Enlace inválido',
          detail: 'El enlace de respuesta está incompleto.'
        }
      };
    }

    const budget = await readBudgetByToken(locals, token);
    if (!budget) {
      return {
        budget: null,
        pageState: 'error' as const,
        pageMessage: {
          kind: 'error' as const,
          title: 'Presupuesto no encontrado',
          detail: 'No encontramos un presupuesto asociado a este enlace.'
        }
      };
    }

    const resolvedBudget = await expireBudgetIfNeeded(locals, budget);

    return {
      budget: mapPublicView(resolvedBudget),
      pageState: 'success' as const,
      pageMessage: null
    };
  } catch {
    return {
      budget: null,
      pageState: 'error' as const,
      pageMessage: fallbackError
    };
  }
};

export const actions: Actions = {
  accept: async ({ params, locals }) => {
    try {
      const token = params.token?.trim();
      if (!token) {
        return fail(400, { actionType: 'accept', operatorError: 'El enlace de respuesta es inválido.' });
      }

      const budget = await readBudgetByToken(locals, token);
      if (!budget) {
        return fail(404, { actionType: 'accept', operatorError: 'No encontramos el presupuesto para este enlace.' });
      }

      const resolvedBudget = await expireBudgetIfNeeded(locals, budget);
      if (!activeResponseStatuses.has(resolvedBudget.status)) {
        return fail(400, {
          actionType: 'accept',
          operatorError: getBlockedResponseMessage(resolvedBudget.status)
        });
      }

      const { error } = await locals.supabase
        .from('budgets')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          rejected_at: null,
          rejection_reason: null
        })
        .eq('id', resolvedBudget.id)
        .in('status', Array.from(activeResponseStatuses));

      if (error) {
        return fail(400, {
          actionType: 'accept',
          operatorError: 'No pudimos registrar tu aceptación. Reintentá en unos segundos.'
        });
      }

      return {
        actionType: 'accept',
        operatorSuccess: '¡Gracias! Confirmamos tu aceptación del presupuesto.'
      };
    } catch {
      return fail(400, {
        actionType: 'accept',
        operatorError: 'No pudimos registrar tu respuesta. Reintentá en unos segundos.'
      });
    }
  },
  reject: async ({ params, locals, request }) => {
    try {
      const token = params.token?.trim();
      if (!token) {
        return fail(400, {
          actionType: 'reject',
          operatorError: 'El enlace de respuesta es inválido.',
          rejectionReason: ''
        });
      }

      const formData = await request.formData();
      const rejectionReason = parseText(formData.get('rejectionReason'));

      if (rejectionReason.length > 500) {
        return fail(400, {
          actionType: 'reject',
          operatorError: 'El motivo de rechazo puede tener hasta 500 caracteres.',
          rejectionReason
        });
      }

      const budget = await readBudgetByToken(locals, token);
      if (!budget) {
        return fail(404, {
          actionType: 'reject',
          operatorError: 'No encontramos el presupuesto para este enlace.',
          rejectionReason
        });
      }

      const resolvedBudget = await expireBudgetIfNeeded(locals, budget);
      if (!activeResponseStatuses.has(resolvedBudget.status)) {
        return fail(400, {
          actionType: 'reject',
          operatorError: getBlockedResponseMessage(resolvedBudget.status),
          rejectionReason
        });
      }

      const { error } = await locals.supabase
        .from('budgets')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          accepted_at: null,
          rejection_reason: rejectionReason || null
        })
        .eq('id', resolvedBudget.id)
        .in('status', Array.from(activeResponseStatuses));

      if (error) {
        return fail(400, {
          actionType: 'reject',
          operatorError: 'No pudimos registrar el rechazo. Reintentá en unos segundos.',
          rejectionReason
        });
      }

      return {
        actionType: 'reject',
        operatorSuccess: 'Gracias por tu respuesta. Registramos el rechazo del presupuesto.',
        rejectionReason: rejectionReason || ''
      };
    } catch {
      return fail(400, {
        actionType: 'reject',
        operatorError: 'No pudimos registrar tu respuesta. Reintentá en unos segundos.',
        rejectionReason: ''
      });
    }
  }
};
