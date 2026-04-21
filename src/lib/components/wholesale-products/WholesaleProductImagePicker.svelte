<script lang="ts">
  import { enhance } from '$app/forms';
  import type { WholesaleProductImageView } from '$lib/types/view-models/wholesale-products';

  type Props = {
    id?: string;
    name?: string;
    label?: string;
    existingImages?: ReadonlyArray<WholesaleProductImageView>;
    helpText?: string;
    onchange?: (files: File[]) => void;
    deleteAction?: string;
  };

  let {
    id = 'images',
    name = 'images',
    label = 'Imágenes',
    existingImages = [],
    helpText = 'Seleccioná una imagen para el producto.',
    onchange,
    deleteAction
  }: Props = $props();

  let preview = $state<{ id: string; name: string; url: string; file?: File } | null>(null);
  let fileInput: HTMLInputElement;
  let deleting = $state(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleDelete = async (imageId: string) => {
    if (!deleteAction || deleting) return;
    deleting = true;

    try {
      const formData = new FormData();
      formData.append('imageId', imageId);

      const response = await fetch(deleteAction, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        window.location.reload();
      }
    } finally {
      deleting = false;
    }
  };

  const handleFileChange = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement;
    const files = target.files ?? [];
    if (files.length === 0) return;

    const file = files[0];
    preview = {
      id: generateId(),
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    };
    onchange?.(preview.file ? [preview.file] : []);
  };

  const removePreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview.url);
    }
    preview = null;
    onchange?.([]);
    if (fileInput) {
      fileInput.value = '';
    }
  };
</script>

<div class="space-y-3">
  <div>
    <label for={id} class="mb-1 block text-sm font-medium text-gray-900">{label}</label>
    <input
      bind:this={fileInput}
      {id}
      {name}
      type="file"
      accept="image/*"
      class="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 file:mr-4 file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-primary-700"
      onchange={handleFileChange}
    />
    <p class="mt-1 text-xs text-gray-500">{helpText}</p>
  </div>

  {#if existingImages.length > 0}
    <div>
      <p class="mb-2 text-sm font-medium text-gray-700">Imagen actual</p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {#each existingImages as image (image.id)}
          <div class="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
            <img src={image.public_url} alt="Imagen del producto" class="h-40 w-full object-cover" />
            {#if deleteAction}
              <div class="absolute right-1 top-1">
                <button
                  type="button"
                  onclick={() => handleDelete(image.id)}
                  disabled={deleting}
                  class="rounded bg-red-500/80 p-1 text-white hover:bg-red-600 disabled:opacity-50"
                  title="Eliminar imagen"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if preview}
    <div>
      <p class="mb-2 text-sm font-medium text-gray-700">Nueva imagen seleccionada</p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div class="relative overflow-hidden rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/40">
          <img src={preview.url} alt={preview.name} class="h-40 w-full object-cover" />
          <p class="truncate px-2 py-1 text-xs text-gray-600">{preview.name}</p>
          <div class="absolute right-1 top-1">
            <button
              type="button"
              onclick={removePreview}
              class="rounded bg-red-500/80 p-1 text-white hover:bg-red-600"
              title="Eliminar"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
