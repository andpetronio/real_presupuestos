/**
 * Lógica de envío de presupuestos por WhatsApp.
 * Usa las funciones de $lib/server/whatsapp/template para construir el mensaje.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { BudgetStatus } from "$lib/types/budget";
import {
  buildWhatsappSendUrl,
  containsBrokenUnicode,
  formatArs,
  normalizeTemplateText,
  normalizeWhatsappNumber,
  renderWhatsappTemplate,
} from "$lib/server/whatsapp/template";
import type { SendWhatsappResult } from "./types";

/** Fila de budget para el flujo de WhatsApp — status tipado como BudgetStatus. */
type BudgetWhatsappRow = {
  id: string;
  status: BudgetStatus;
  tutor_id: string;
  final_sale_price: number | null;
  expires_at: string | null;
  public_token: string | null;
  reference_month: string | null;
  reference_days: number | null;
};

/**
 * Label del mes en español.
 */
export const getMonthLabel = (date: Date): string =>
  new Intl.DateTimeFormat("es-AR", { month: "long" }).format(date);

/**
 * Formatea fecha ISO a label legible.
 */
export const getDateLabel = (isoDate: string | null): string => {
  if (!isoDate) return "sin fecha";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "sin fecha";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

/**
 * Arma el resumen de perros para el mensaje.
 */
export const buildDogsSummary = (
  dogs: ReadonlyArray<{ name: string; requestedDays: number }>,
): string => {
  if (dogs.length === 0) return "tu perro";

  const labels = dogs.map(
    (dog) => `${dog.requestedDays} días para ${dog.name}`,
  );
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} y ${labels[1]}`;

  const head = labels.slice(0, -1).join(", ");
  const tail = labels[labels.length - 1];
  return `${head} y ${tail}`;
};

/**
 * Construye el contexto para el template de WhatsApp.
 */
export const buildWhatsappContext = (params: {
  tutorFullName: string;
  dogsSummary: string;
  finalSalePrice: number;
  expiresAt: string | null;
  referenceMonth: string | null;
  referenceDays: number | null;
  businessName: string;
  link: string;
  whatsappNumber: string;
}) => {
  const {
    tutorFullName,
    dogsSummary,
    finalSalePrice,
    expiresAt,
    referenceMonth,
    referenceDays,
    businessName,
    link,
    whatsappNumber,
  } = params;

  const now = new Date();
  const referenceDate = referenceMonth
    ? new Date(`${referenceMonth}T00:00:00`)
    : now;
  const referenceMonthLabel = Number.isNaN(referenceDate.getTime())
    ? getMonthLabel(now)
    : getMonthLabel(referenceDate);
  const days = Number(referenceDays ?? 30);

  return {
    tutor_nombre: tutorFullName,
    tutor: tutorFullName,
    perros: dogsSummary,
    perro: dogsSummary,
    total_final: formatArs(finalSalePrice),
    total: formatArs(finalSalePrice),
    fecha_limite: getDateLabel(expiresAt),
    fecha: getDateLabel(expiresAt),
    mes_referencia: referenceMonthLabel,
    mes: referenceMonthLabel,
    dias_referencia: days,
    dias: days,
    nombre_emprendimiento: businessName || "REAL",
    emprendimiento: businessName || "REAL",
    link_presupuesto: link,
    link: link,
    whatsapp_tutor: whatsappNumber,
  };
};

/**
 * Envía un presupuesto por WhatsApp.
 *
 * @param params.budgetId ID del presupuesto.
 * @param params.supabase Instancia de Supabase.
 * @param params.origin Origin de la URL (para generar links).
 * @param params.userAgent User agent opcional para tracking.
 */
export const sendBudgetWhatsapp = async (params: {
  budgetId: string;
  supabase: SupabaseClient;
  origin: string;
  userAgent?: string | null;
}): Promise<SendWhatsappResult> => {
  const { budgetId, supabase, origin, userAgent } = params;

  // 1. Leer el presupuesto
  const { data: budget, error: budgetError } = await supabase
    .from("budgets")
    .select(
      "id, status, tutor_id, final_sale_price, expires_at, public_token, reference_month, reference_days",
    )
    .eq("id", budgetId)
    .maybeSingle();

  if (budgetError || !budget) {
    return { ok: false, message: "No encontramos el presupuesto a enviar." };
  }

  const budgetTyped: BudgetWhatsappRow = budget;

  if (
    budgetTyped.status !== "draft" &&
    budgetTyped.status !== "ready_to_send"
  ) {
    return {
      ok: false,
      message:
        "Solo podés enviar presupuestos en borrador o listos para enviar.",
    };
  }

  // 2. Leer el tutor
  const { data: tutor, error: tutorError } = await supabase
    .from("tutors")
    .select("full_name, whatsapp_number")
    .eq("id", budgetTyped.tutor_id)
    .maybeSingle();

  if (tutorError || !tutor) {
    return { ok: false, message: "No encontramos el tutor del presupuesto." };
  }

  const toNumber = normalizeWhatsappNumber(tutor.whatsapp_number ?? "");
  if (!toNumber) {
    return {
      ok: false,
      message: "El tutor no tiene un número de WhatsApp válido para envío.",
    };
  }

  // 3. Leer settings
  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select(
      "business_name, whatsapp_default_template, whatsapp_signature, bank_cbu, bank_alias, bank_account_holder, bank_provider",
    )
    .eq("id", 1)
    .single();

  if (settingsError || !settings) {
    return {
      ok: false,
      message:
        "No pudimos leer la configuración de WhatsApp para enviar el presupuesto.",
    };
  }

  // 4. Leer perros del presupuesto
  const { data: budgetDogs, error: budgetDogsError } = await supabase
    .from("budget_dogs")
    .select("requested_days, dog:dogs(name)")
    .eq("budget_id", budgetTyped.id);

  if (budgetDogsError) {
    return {
      ok: false,
      message: "No pudimos armar el detalle de perros para el mensaje.",
    };
  }

  const dogsWithDays = (budgetDogs ?? [])
    .map((row) => ({
      name: ((row.dog as { name?: string } | null)?.name ?? "").trim(),
      requestedDays: Number(row.requested_days ?? 0),
    }))
    .filter((dog) => Boolean(dog.name) && dog.requestedDays > 0);

  // 5. Construir mensaje
  const dogsSummary = buildDogsSummary(dogsWithDays);
  const now = new Date();
  const link = `${origin}/budget-response/${budgetTyped.public_token}`;

  const template = (settings.whatsapp_default_template ?? "").trim();
  if (!template) {
    return {
      ok: false,
      message:
        "No hay un mensaje base configurado para WhatsApp. Completalo en Configuración > WhatsApp / Mensajería y reintentá.",
    };
  }

  if (containsBrokenUnicode(template)) {
    return {
      ok: false,
      message:
        "El mensaje base tiene caracteres inválidos (�). Guardalo de nuevo en Configuración escribiendo o pegando los emojis correctos.",
    };
  }

  const context = buildWhatsappContext({
    tutorFullName: tutor.full_name ?? "Cliente",
    dogsSummary,
    finalSalePrice: Number(budgetTyped.final_sale_price ?? 0),
    expiresAt: budgetTyped.expires_at,
    referenceMonth: budgetTyped.reference_month,
    referenceDays: budgetTyped.reference_days,
    businessName: settings.business_name ?? "REAL",
    link,
    whatsappNumber: toNumber,
  });

  const bankContext = {
    cbu_transferencia: settings.bank_cbu ?? "",
    alias_transferencia: settings.bank_alias ?? "",
    titular_transferencia: settings.bank_account_holder ?? "",
    proveedor_transferencia: settings.bank_provider ?? "",
  };

  const rendered = renderWhatsappTemplate(normalizeTemplateText(template), {
    ...context,
    ...bankContext,
  });
  if (containsBrokenUnicode(rendered)) {
    return {
      ok: false,
      message:
        "El mensaje generado para WhatsApp contiene caracteres inválidos (�). Revisá nombres, plantilla y variables antes de enviar.",
    };
  }

  // 6. Agregar firma
  const normalizedSignature = settings.whatsapp_signature
    ? normalizeTemplateText(settings.whatsapp_signature)
    : "";
  if (containsBrokenUnicode(normalizedSignature)) {
    return {
      ok: false,
      message:
        "La firma de WhatsApp tiene caracteres inválidos (�). Guardala de nuevo en Configuración pegando los emojis correctos.",
    };
  }

  const signature = normalizedSignature ? `\n\n${normalizedSignature}` : "";
  const finalMessage = normalizeTemplateText(`${rendered}${signature}`);
  if (containsBrokenUnicode(finalMessage)) {
    return {
      ok: false,
      message:
        "El mensaje final de WhatsApp contiene caracteres inválidos (�). Revisá plantilla, firma y datos del tutor.",
    };
  }

  // 7. Construir URL de WhatsApp
  const waMeUrl = buildWhatsappSendUrl({
    phone: toNumber,
    message: finalMessage,
    userAgent,
  });

  // 8. Guardar mensaje en draft
  const { error: updateError } = await supabase
    .from("budgets")
    .update({
      whatsapp_message_draft: rendered,
      whatsapp_message_sent: null,
    })
    .eq("id", budgetTyped.id);

  if (updateError) {
    return {
      ok: false,
      message:
        "No pudimos preparar el mensaje para WhatsApp. Reintentá en unos segundos.",
    };
  }

  return { ok: true, waMeUrl };
};
