<script lang="ts">
  import { Card, Button } from 'flowbite-svelte';
  import ActiveStatusBadge from '$lib/components/admin/ActiveStatusBadge.svelte';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';

  const formatQuantity = (value: number): string => {
    return new Intl.NumberFormat('es-AR').format(value);
  };

  type RawMaterialRow = {
    id: string;
    name: string;
    base_unit: string;
    purchase_quantity: number;
    base_cost: number;
    wastage_percentage: number;
    cost_with_wastage: number;
    is_active: boolean;
  };

  type RawMaterialMobileCardsProps = {
    rawMaterials: ReadonlyArray<RawMaterialRow>;
  };

  let { rawMaterials }: RawMaterialMobileCardsProps = $props();
</script>

<div class="space-y-3 md:hidden" aria-label="Lista de materias primas">
  {#each rawMaterials as material (material.id)}
    <Card class="p-4" role="listitem">
      <!-- Nombre + Estado -->
      <div class="mb-3 flex items-start justify-between gap-2">
        <p class="font-semibold text-gray-900">{material.name}</p>
        <ActiveStatusBadge
          isActive={material.is_active}
          activeLabel="Activa"
          inactiveLabel="Inactiva"
        />
      </div>

      <!-- Unidad + Cantidad -->
      <div class="mb-3 text-sm">
        <p class="text-xs text-gray-500">Cantidad comprada</p>
        <p class="font-medium">{formatQuantity(material.purchase_quantity)} {material.base_unit}</p>
      </div>

      <!-- Costos -->
      <div class="mb-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p class="text-xs text-gray-500">Costo base</p>
          <p class="font-medium">{formatArs(material.base_cost)}</p>
        </div>
        <div>
          <p class="text-xs text-gray-500">Costo con merma</p>
          <p class="font-medium">{formatArs(material.cost_with_wastage)}</p>
        </div>
      </div>

      <!-- Merma -->
      <div class="mb-3 text-sm">
        <p class="text-xs text-gray-500">Merma</p>
        <p class="font-medium">{material.wastage_percentage.toFixed(2)}%</p>
      </div>

      <!-- Acciones -->
      <div class="flex flex-wrap gap-2">
        <Button
          href={route('/raw-materials/', material.id, '/update')}
          size="xs"
          color="light"
          aria-label="Editar {material.name}"
        >
          Editar
        </Button>
      </div>
    </Card>
  {/each}
</div>
