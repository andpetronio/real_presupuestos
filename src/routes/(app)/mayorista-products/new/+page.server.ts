import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import {
  extractImageFiles,
  parsePrice,
  parseText,
  uploadWholesaleProductImages,
} from "$lib/server/wholesale-backoffice/products";

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = parseText(formData.get("name"));
    const presentation = parseText(formData.get("presentation"));
    const description = parseText(formData.get("description"));
    const priceArs = parsePrice(formData.get("priceArs"));

    if (!name || !presentation) {
      return fail(400, {
        operatorError: "Nombre y presentación son obligatorios.",
        values: { name, presentation, priceArs: String(priceArs), description },
      });
    }

    const { data: product, error } = await locals.supabase
      .from("wholesale_products")
      .insert({
        name,
        presentation,
        description: description || null,
        price_ars: priceArs,
      })
      .select("id")
      .single();

    if (error || !product) {
      return fail(400, {
        operatorError: "No pudimos crear el producto mayorista.",
        values: { name, presentation, priceArs: String(priceArs), description },
      });
    }

    const files = extractImageFiles(formData);
    console.log("[DEBUG] Archivos encontrados:", files.length);
    await uploadWholesaleProductImages({
      supabase: locals.supabase,
      productId: product.id,
      files,
      startingSortOrder: 0,
    });

    throw redirect(303, "/mayorista-products");
  },
};
