import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  generateWholesalerCode,
  getWholesalerError,
  getWholesalerFormValues,
  isValidEmail,
  mapWholesalerCategoryOptions,
  normalizeEmail,
  normalizeOptionalText,
  normalizeTaxId,
  normalizeWhatsapp,
  parseInteger,
  parseText,
} from "$lib/server/wholesale-backoffice/wholesalers";

export const load: PageServerLoad = async ({ locals }) => {
  const { data } = await locals.supabase
    .from("wholesaler_categories")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return {
    categories: mapWholesalerCategoryOptions(data),
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const draftValues = getWholesalerFormValues({
      formData,
      fallbackMinTotalUnits: "5",
      fallbackDeliveryDays: "7",
    });

    const name = parseText(formData.get("name"));
    const minTotalUnits = parseInteger(formData.get("minTotalUnits"));
    const deliveryDays = parseInteger(formData.get("deliveryDays"));
    const notes = normalizeOptionalText(formData.get("notes"));
    const providedCode = draftValues.code;
    const categoryId = normalizeOptionalText(formData.get("categoryId"));
    const taxId = normalizeTaxId(formData.get("taxId"));
    const contactFullName = normalizeOptionalText(
      formData.get("contactFullName"),
    );
    const contactWhatsapp = normalizeWhatsapp(formData.get("contactWhatsapp"));
    const contactEmail = normalizeEmail(formData.get("contactEmail"));
    const address = normalizeOptionalText(formData.get("address"));
    const deliveryPreference = normalizeOptionalText(
      formData.get("deliveryPreference"),
    );
    const paymentPreference = normalizeOptionalText(
      formData.get("paymentPreference"),
    );

    if (!name) {
      return fail(400, {
        operatorError: "Ingresá un nombre para el mayorista.",
        values: draftValues,
      });
    }

    if (taxId && taxId.length > 13) {
      return fail(400, {
        operatorError: "El CUIT/DNI no puede superar los 13 caracteres.",
        values: draftValues,
      });
    }

    if (!isValidEmail(contactEmail)) {
      return fail(400, {
        operatorError: "Ingresá un email de contacto válido.",
        values: draftValues,
      });
    }

    if (categoryId) {
      const categoryResult = await locals.supabase
        .from("wholesaler_categories")
        .select("id")
        .eq("id", categoryId)
        .maybeSingle();

      if (categoryResult.error || !categoryResult.data) {
        return fail(400, {
          operatorError: "La categoría seleccionada no es válida.",
          values: draftValues,
        });
      }
    }

    const code =
      providedCode || (await generateWholesalerCode(locals.supabase));
    if (!code) {
      return fail(400, {
        operatorError: "No pudimos generar el código del mayorista.",
        values: draftValues,
      });
    }

    const { error } = await locals.supabase.from("wholesalers").insert({
      name,
      unique_random_code: code,
      min_total_units: minTotalUnits,
      delivery_days: deliveryDays,
      category_id: categoryId,
      tax_id: taxId,
      contact_full_name: contactFullName,
      contact_whatsapp: contactWhatsapp,
      contact_email: contactEmail,
      address,
      delivery_preference: deliveryPreference,
      payment_preference: paymentPreference,
      notes,
    });

    if (error) {
      return fail(400, {
        operatorError: getWholesalerError("create", error.message),
        values: draftValues,
      });
    }

    throw redirect(303, "/admin-mayoristas");
  },
};
