import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  deleteWholesaleProductImage,
  extractImageFiles,
  parsePrice,
  parseText,
  uploadWholesaleProductImages,
} from "$lib/server/wholesale-backoffice/products";

export const load: PageServerLoad = async ({ locals, params }) => {
  const productResult = await locals.supabase
    .from("wholesale_products")
    .select("id, name, presentation, price_ars, description, is_active")
    .eq("id", params.product_id)
    .maybeSingle();

  if (productResult.error || !productResult.data) {
    throw redirect(303, "/mayorista-products");
  }

  const imagesResult = await locals.supabase
    .from("wholesale_product_images")
    .select("id, public_url, storage_path, sort_order")
    .eq("product_id", params.product_id)
    .order("sort_order", { ascending: true });

  return {
    product: {
      ...productResult.data,
      images: imagesResult.data ?? [],
    },
  };
};

export const actions: Actions = {
  update: async ({ request, locals, params }) => {
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

    const { error } = await locals.supabase
      .from("wholesale_products")
      .update({
        name,
        presentation,
        description: description || null,
        price_ars: priceArs,
      })
      .eq("id", params.product_id);

    if (error) {
      return fail(400, {
        operatorError: "No pudimos actualizar el producto mayorista.",
        values: { name, presentation, priceArs: String(priceArs), description },
      });
    }

    throw redirect(303, "/mayorista-products");
  },
  uploadImages: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const files = extractImageFiles(formData);

    console.log("[DEBUG] uploadImages - files length:", files.length);
    console.log("[DEBUG] uploadImages - formData keys:", [...formData.keys()]);

    if (files.length === 0) {
      console.log("[DEBUG] No se encontraron archivos en formData");
      console.log(
        "[DEBUG] valores del campo images:",
        formData.getAll("images"),
      );
      return fail(400, { operatorError: "Seleccioná al menos una imagen." });
    }

    const lastSortResult = await locals.supabase
      .from("wholesale_product_images")
      .select("sort_order")
      .eq("product_id", params.product_id)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const startingSortOrder = (lastSortResult.data?.sort_order ?? -1) + 1;
    await uploadWholesaleProductImages({
      supabase: locals.supabase,
      productId: params.product_id,
      files,
      startingSortOrder,
    });

    return { operatorSuccess: "Imágenes actualizadas correctamente." };
  },
  deleteImage: async ({ request, locals }) => {
    const formData = await request.formData();
    const imageId = parseText(formData.get("imageId"));
    if (!imageId) {
      return fail(400, { operatorError: "No encontramos la imagen." });
    }

    const result = await deleteWholesaleProductImage({
      supabase: locals.supabase,
      imageId,
    });
    if (!result.ok) {
      return fail(400, { operatorError: "No pudimos eliminar la imagen." });
    }

    return { operatorSuccess: "Imagen eliminada correctamente." };
  },
  toggleActive: async ({ request, locals, params }) => {
    const formData = await request.formData();
    const shouldActivate = parseText(formData.get("activate")) === "true";
    const { error } = await locals.supabase
      .from("wholesale_products")
      .update({ is_active: shouldActivate })
      .eq("id", params.product_id);

    if (error) {
      return fail(400, {
        operatorError: "No pudimos actualizar el estado del producto.",
      });
    }

    return {
      operatorSuccess: shouldActivate
        ? "Producto restaurado."
        : "Producto desactivado.",
    };
  },
};
