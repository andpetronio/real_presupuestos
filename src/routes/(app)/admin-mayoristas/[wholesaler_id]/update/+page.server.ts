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

export const load: PageServerLoad = async ({ locals, params }) => {
  const wholesalerResult = await locals.supabase
    .from("wholesalers")
    .select(
      "id, name, unique_random_code, min_total_units, delivery_days, is_active, notes, category_id, tax_id, contact_full_name, contact_whatsapp, contact_email, address, delivery_preference, payment_preference",
    )
    .eq("id", params.wholesaler_id)
    .maybeSingle();

  if (wholesalerResult.error || !wholesalerResult.data) {
    throw redirect(303, "/admin-mayoristas");
  }
  const wholesaler = wholesalerResult.data;

  const categoriesResult = await locals.supabase
    .from("wholesaler_categories")
    .select("id, name, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const categories = mapWholesalerCategoryOptions(categoriesResult.data);

  if (
    wholesaler.category_id &&
    !categories.some((category) => category.id === wholesaler.category_id)
  ) {
    const currentCategoryResult = await locals.supabase
      .from("wholesaler_categories")
      .select("id, name, is_active")
      .eq("id", wholesaler.category_id)
      .maybeSingle();

    if (currentCategoryResult.data) {
      categories.unshift(currentCategoryResult.data);
    }
  }

  return {
    wholesaler,
    categories,
  };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const draftValues = getWholesalerFormValues({ formData });
    const name = parseText(formData.get("name"));
    const code = draftValues.code;
    const minTotalUnits = parseInteger(formData.get("minTotalUnits"));
    const deliveryDays = parseInteger(formData.get("deliveryDays"));
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
    const notes = normalizeOptionalText(formData.get("notes"));

    if (!name || !code) {
      return fail(400, {
        operatorError: "Nombre y código son obligatorios.",
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

    const { error } = await locals.supabase
      .from("wholesalers")
      .update({
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
      })
      .eq("id", params.wholesaler_id);

    if (error) {
      return fail(400, {
        operatorError: getWholesalerError("update", error.message),
        values: draftValues,
      });
    }

    throw redirect(303, "/admin-mayoristas");
  },
  toggleActive: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const shouldActivate = parseText(formData.get("activate")) === "true";

    const { error } = await locals.supabase
      .from("wholesalers")
      .update({ is_active: shouldActivate })
      .eq("id", params.wholesaler_id);

    if (error) {
      return fail(400, {
        operatorError: "No pudimos actualizar el estado del mayorista.",
      });
    }

    return {
      operatorSuccess: shouldActivate
        ? "Mayorista restaurado."
        : "Mayorista desactivado.",
    };
  },
  regenerateCode: async ({ locals, params }) => {
    const code = await generateWholesalerCode(locals.supabase);
    if (!code) {
      return fail(400, { operatorError: "No pudimos regenerar el código." });
    }

    const { error } = await locals.supabase
      .from("wholesalers")
      .update({ unique_random_code: code })
      .eq("id", params.wholesaler_id);

    if (error) {
      return fail(400, {
        operatorError: "No pudimos actualizar el código del mayorista.",
      });
    }

    return { operatorSuccess: "Código regenerado correctamente." };
  },
};
