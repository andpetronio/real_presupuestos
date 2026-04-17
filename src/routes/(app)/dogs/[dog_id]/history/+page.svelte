<script lang="ts">
  import { Badge, Button, Card } from 'flowbite-svelte';
  import FeedbackBanner from '$lib/components/FeedbackBanner.svelte';
  import { formatArs } from '$lib/shared/currency';
  import { route } from '$lib/shared/navigation';

  type RecipeSummary = {
    recipeName: string;
    assignedDays: number;
    preparedDays: number;
    deliveredDays: number;
  };

  type BudgetSummary = {
    budgetId: string;
    status: string;
    referenceMonth: string | null;
    acceptedAt: string | null;
    totalPrice: number;
    paid: number;
    totalAssignedDays: number;
    totalPreparedDays: number;
    totalDeliveredDays: number;
    recipes: RecipeSummary[];
  };

  type PageData = {
    dog: {
      id: string;
      name: string;
      tutorName: string;
      dietType: string;
      mealsPerDay: number;
      isActive: boolean;
    };
    budgets: BudgetSummary[];
  };

  let { data }: { data: PageData } = $props();

  const dietLabels: Record<string, string> = {
    mixta: 'Mixta',
    cocida: 'Cocida',
    barf: 'BARF'
  };

  const editPath = $derived(route('/dogs/', data.dog.id, '/update'));
  const dogsPath = $derived(route('/dogs'));

  const formatDate = (value: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR');
  };

  const formatMonth = (value: string | null): string => {
    if (!value) return '—';
    const [year, month] = value.split('-');
    if (!year || !month) return value;
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
  };

  const statusLabel: Record<string, string> = {
    draft: 'Borrador',
    ready_to_send: 'Listo para enviar',
    sent: 'Enviado',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
    expired: 'Expirado',
    discarded: 'Descartado',
    closed: 'Cerrado'
  };

  const statusColor: Record<string, 'primary' | 'gray' | 'green' | 'amber' | 'secondary'> = {
    draft: 'gray',
    ready_to_send: 'amber',
    sent: 'primary',
    accepted: 'green',
    rejected: 'secondary',
    expired: 'gray',
    discarded: 'gray',
    closed: 'gray'
  };
</script>

<div class="mb-6 flex items-center justify-between gap-3">
  <div>
    <p class="text-sm font-semibold text-gray-500">
      <a href={dogsPath} class="hover:underline">Perros</a> / Histórico
    </p>
    <h1 class="mt-1 text-2xl font-bold text-gray-900">{data.dog.name}</h1>
    <p class="text-sm text-gray-500">{data.dog.tutorName}</p>
  </div>
  <Button href={editPath} color="light">Editar</Button>
</div>

<div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
  <div class="rounded-lg bg-gray-50 p-3">
    <p class="text-xs uppercase tracking-wide text-gray-500">Tipo de dieta</p>
    <p class="mt-1 text-sm font-semibold text-gray-900">{dietLabels[data.dog.dietType] ?? data.dog.dietType}</p>
  </div>
  <div class="rounded-lg bg-gray-50 p-3">
    <p class="text-xs uppercase tracking-wide text-gray-500">Comidas por día</p>
    <p class="mt-1 text-sm font-semibold text-gray-900">{data.dog.mealsPerDay}</p>
  </div>
  <div class="rounded-lg bg-gray-50 p-3">
    <p class="text-xs uppercase tracking-wide text-gray-500">Estado</p>
    <p class="mt-1 text-sm font-semibold text-gray-900">{data.dog.isActive ? 'Activo' : 'Inactivo'}</p>
  </div>
</div>

{#if data.budgets.length === 0}
  <Card class="w-full p-6 shadow-sm">
    <p class="text-center text-gray-500">No hay presupuestos para este perro.</p>
  </Card>
{:else}
  <div class="space-y-4">
    {#each data.budgets as budget (budget.budgetId)}
      {@const paid = budget.paid}
      {@const pending = budget.totalPrice - paid}
      {@const prepPct = budget.totalAssignedDays > 0 ? Math.round((budget.totalPreparedDays / budget.totalAssignedDays) * 100) : 0}
      {@const delPct = budget.totalAssignedDays > 0 ? Math.round((budget.totalDeliveredDays / budget.totalAssignedDays) * 100) : 0}

      <Card class="w-full p-0 shadow-sm">
        <div class="p-4 sm:p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold text-gray-900">
                  {formatMonth(budget.referenceMonth)}
                </h3>
                <Badge color={statusColor[budget.status] ?? 'gray'}>
                  {statusLabel[budget.status] ?? budget.status}
                </Badge>
              </div>
              <p class="mt-1 text-sm text-gray-500">
                Aceptado: {formatDate(budget.acceptedAt)}
              </p>
            </div>
            <a
              href={route('/seguimiento/', budget.budgetId)}
              class="text-sm font-medium text-primary-600 hover:underline"
            >
              Ver seguimiento →
            </a>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-lg bg-gray-50 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">Total</p>
              <p class="text-base font-semibold text-gray-900">{formatArs(budget.totalPrice)}</p>
            </div>
            <div class="rounded-lg bg-accent-50 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">Cobrado</p>
              <p class="text-base font-semibold text-accent-700">{formatArs(paid)}</p>
            </div>
            <div class="rounded-lg bg-secondary-50 p-3">
              <p class="text-xs uppercase tracking-wide text-gray-500">Saldo</p>
              <p class="text-base font-semibold text-secondary-700">{formatArs(pending)}</p>
            </div>
          </div>

          {#if budget.recipes.length > 0}
            <div class="mt-5 border-t border-gray-200 pt-4">
              <div class="flex items-center justify-between mb-3">
                <p class="text-sm font-semibold text-gray-900">
                  Recetas ({budget.totalAssignedDays} días asignados)
                </p>
              </div>
              <div class="space-y-3">
                {#each budget.recipes as recipe (recipe.recipeName)}
                  <div class="rounded-md bg-gray-50 p-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <p class="font-medium text-gray-900">{recipe.recipeName}</p>
                      <Badge color="gray">{recipe.assignedDays} días</Badge>
                    </div>
                    <div class="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div>
                        <p class="text-xs text-gray-600">
                          Preparado: {recipe.preparedDays}/{recipe.assignedDays}
                          ({budget.totalPreparedDays > 0 ? Math.round((recipe.preparedDays / budget.totalAssignedDays) * 100) : 0}%)
                        </p>
                        <div class="mt-1 h-2 rounded-full bg-gray-200">
                          <div
                            class="h-2 rounded-full bg-primary-500"
                            style={`width: ${prepPct}%`}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <p class="text-xs text-gray-600">
                          Entregado: {recipe.deliveredDays}/{recipe.assignedDays}
                          ({budget.totalDeliveredDays > 0 ? Math.round((recipe.deliveredDays / budget.totalAssignedDays) * 100) : 0}%)
                        </p>
                        <div class="mt-1 h-2 rounded-full bg-gray-200">
                          <div
                            class="h-2 rounded-full bg-accent-500"
                            style={`width: ${delPct}%`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </Card>
    {/each}
  </div>
{/if}
