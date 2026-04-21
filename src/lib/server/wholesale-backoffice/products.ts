import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export const WHOLESALE_PRODUCTS_BUCKET = 'wholesale-products';

export const parseText = (value: FormDataEntryValue | null): string =>
  typeof value === 'string' ? value.trim() : '';

export const parsePrice = (value: FormDataEntryValue | null): number => {
  const parsed = Number(typeof value === 'string' ? value : '0');
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

export const extractImageFiles = (
  formData: FormData,
  fieldName = 'images',
): File[] =>
  formData
    .getAll(fieldName)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

export const uploadWholesaleProductImages = async (params: {
  supabase: SupabaseClient;
  productId: string;
  files: File[];
  startingSortOrder?: number;
}) => {
  const start = params.startingSortOrder ?? 0;

  for (let index = 0; index < params.files.length; index += 1) {
    const file = params.files[index];
    console.log('[DEBUG] Intentando subir:', file.name, file.size, file.type);

    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const fileName = `${randomUUID()}.${extension}`;
    const storagePath = `${params.productId}/${fileName}`;
    console.log('[DEBUG] Storage path:', storagePath);

    const uploadResult = await params.supabase.storage
      .from(WHOLESALE_PRODUCTS_BUCKET)
      .upload(storagePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadResult.error) {
      console.log('[DEBUG] Upload ERROR:', uploadResult.error.message);
      continue;
    }
    console.log('[DEBUG] Upload OK:', storagePath);

    const publicUrl = params.supabase.storage
      .from(WHOLESALE_PRODUCTS_BUCKET)
      .getPublicUrl(storagePath).data.publicUrl;
    console.log('[DEBUG] Public URL:', publicUrl);

    const insertResult = await params.supabase.from('wholesale_product_images').insert({
      product_id: params.productId,
      storage_path: storagePath,
      public_url: publicUrl,
      sort_order: start + index,
    });

    if (insertResult.error) {
      console.log('[DEBUG] Insert DB ERROR:', insertResult.error.message);
    } else {
      console.log('[DEBUG] Insert DB OK');
    }
  }
};

export const deleteWholesaleProductImage = async (params: {
  supabase: SupabaseClient;
  imageId: string;
}) => {
  const imageResult = await params.supabase
    .from('wholesale_product_images')
    .select('id, storage_path')
    .eq('id', params.imageId)
    .maybeSingle();

  if (imageResult.error || !imageResult.data) {
    return { ok: false as const };
  }

  if (imageResult.data.storage_path) {
    await params.supabase.storage
      .from(WHOLESALE_PRODUCTS_BUCKET)
      .remove([imageResult.data.storage_path]);
  }

  const deleteResult = await params.supabase
    .from('wholesale_product_images')
    .delete()
    .eq('id', params.imageId);

  return { ok: !deleteResult.error } as const;
};
