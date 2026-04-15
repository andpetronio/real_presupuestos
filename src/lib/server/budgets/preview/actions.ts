import { redirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BudgetStatus } from '$lib/types/budget';
import {
  buildWhatsappSendUrl,
  containsBrokenUnicode,
  normalizeTemplateText,
  normalizeWhatsappNumber,
  renderWhatsappTemplate
} from '$lib/server/whatsapp/template';

const getMonthLabel = (date: Date): string =>
  new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(date);

type SendWhatsappResult = { waUrl?: string; error?: string };
type MarkSentResult = { error?: string };

type SendWhatsappParams = {
  params: { id: string };
  locals: { supabase: SupabaseClient };
  request: Request;
};

type MarkSentParams = {
  params: { id: string };
  locals: { supabase: SupabaseClient };
};

export const sendWhatsappAction = async ({ params, locals, request }: SendWhatsappParams): Promise<SendWhatsappResult> => {
  const budgetId = params.id;

  try {
    // Budget + tutor en una sola query (JOIN implícito de Supabase)
    const budgetResult = await locals.supabase
      .from('budgets')
      .select('id, status, tutor_id, final_sale_price, expires_at, public_token, reference_month, reference_days, tutor: tutors(full_name, whatsapp_number)')
      .eq('id', budgetId)
      .single();

    if (budgetResult.error) throw budgetResult.error;
    const budget = budgetResult.data;

    if ((budget.status as BudgetStatus) !== 'draft') {
      return { error: 'Solo se puede enviar por WhatsApp cuando el presupuesto está en borrador.' };
    }

    const tutor = budget.tutor as { full_name?: string; whatsapp_number?: string } | null;

    if (!tutor?.whatsapp_number) {
      return { error: 'El tutor no tiene teléfono registrado.' };
    }

    const normalizedNumber = normalizeWhatsappNumber(tutor!.whatsapp_number!);
    if (!normalizedNumber) {
      return { error: 'El número de teléfono no es válido.' };
    }

    const settingsResult = await locals.supabase
      .from('settings')
      .select('whatsapp_default_template')
      .eq('id', 1)
      .single();

    if (settingsResult.error) throw settingsResult.error;

    let template = settingsResult.data?.whatsapp_default_template ?? '';
    if (!template) {
      template = 'Hola {{tutor_nombre}}, te compartimos el presupuesto: {{total_final}}. Vence {{fecha_limite}}.';
    }

    if (containsBrokenUnicode(template)) {
      return {
        error:
          'El mensaje base de WhatsApp tiene caracteres inválidos (�). Guardalo de nuevo en Configuración pegando los emojis correctos.'
      };
    }

    // JOIN: budget_dogs + dogs en una sola query
    const { data: budgetDogs } = await locals.supabase
      .from('budget_dogs')
      .select('dog:dogs(name)')
      .eq('budget_id', budgetId);

    const dogNames = (budgetDogs ?? [])
      .map((row) => (row.dog as { name?: string } | null)?.name ?? '')
      .filter(Boolean)
      .join(', ');

    const expirationDate = budget.expires_at
      ? new Date(budget.expires_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '';

    const responseLink = budget.public_token ? `${new URL(request.url).origin}/budget-response/${budget.public_token}` : '';
    const referenceDate = budget.reference_month ? new Date(`${budget.reference_month}T00:00:00`) : new Date();
    const referenceMonth = Number.isNaN(referenceDate.getTime()) ? getMonthLabel(new Date()) : getMonthLabel(referenceDate);
    const referenceDays = Number(budget.reference_days ?? 30);

    const rendered = renderWhatsappTemplate(template, {
      tutor_nombre: tutor?.full_name ?? 'Cliente',
      perros: dogNames,
      total_final: budget.final_sale_price.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
      mes_referencia: referenceMonth,
      mes: referenceMonth,
      dias_referencia: referenceDays,
      dias: referenceDays,
      fecha_limite: expirationDate,
      link_presupuesto: responseLink,
      link: responseLink
    });

    if (containsBrokenUnicode(rendered)) {
      return {
        error:
          'El mensaje generado para WhatsApp contiene caracteres inválidos (�). Revisá la plantilla y reemplazá los emojis en Configuración.'
      };
    }

    const normalizedMessage = normalizeTemplateText(rendered);

    const waUrl = buildWhatsappSendUrl({
      phone: normalizedNumber,
      message: normalizedMessage,
      userAgent: request.headers?.get?.('user-agent') ?? null
    });

    const { error: markSentError } = await locals.supabase
      .from('budgets')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', budgetId)
      .eq('status', 'draft');

    if (markSentError) {
      return { error: 'No pudimos marcar el presupuesto como enviado. Reintentá en unos segundos.' };
    }

    return { waUrl };
  } catch (error) {
    return { error: 'No pudimos generar el enlace de WhatsApp.' };
  }
};

export const markSentAction = async ({ params, locals }: MarkSentParams): Promise<MarkSentResult> => {
  const budgetId = params.id;

  const budgetResult = await locals.supabase
    .from('budgets')
    .select('id, status')
    .eq('id', budgetId)
    .single();

  if (budgetResult.error || !budgetResult.data) {
    return { error: 'No encontramos el presupuesto a marcar como enviado.' };
  }

  if ((budgetResult.data.status as BudgetStatus) !== 'draft') {
    return { error: 'Solo podés marcar como enviado presupuestos en borrador.' };
  }

  const { error } = await locals.supabase
    .from('budgets')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', budgetId);

  if (error) {
    return { error: 'No pudimos marcar el presupuesto como enviado. Reintentá en unos segundos.' };
  }

  throw redirect(303, '/budgets');
};
