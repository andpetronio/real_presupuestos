<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { browser } from '$app/environment';
  import { resolve } from '$app/paths';
  import {
    Button,
    Card,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell
  } from 'flowbite-svelte';
  import FormShell from '$lib/components/admin/FormShell.svelte';
  import StatusBadge from '$lib/components/admin/StatusBadge.svelte';
  import type { BudgetStatus } from '$lib/types/budget';
  import { formatArs, formatQuantity } from '$lib/shared/currency';
  import type { UIState } from '$lib/server/shared/ui-state';
  import { route } from '$lib/shared/navigation';
  import { closeBlockingLoader, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';
  type RecipeItemDetail = {
    materialId: string;
    materialName: string;
    baseUnit: string;
    dailyQuantity: number;
    unitCost: number;
    subtotal: number;
  };

  type RecipeCostBreakdown = {
    recipeId: string;
    recipeName: string;
    assignedDays: number;
    items: RecipeItemDetail[];
    recipeTotal: number;
  };

  type OperationalLineItem = {
    name: string;
    quantity: number;
    unitCost: number;
    subtotal: number;
  };

  type SettingsCosts = {
    meal_plan_margin: number;
  };

  type PageData = {
    budget: {
      id: string;
      status: string;
      tutor: { full_name: string } | null;
      notes: string | null;
      final_sale_price: number;
      total_cost: number;
      ingredient_total_global: number;
      operational_total_global: number;
      applied_margin: number;
      created_at: string;
      expires_at: string | null;
    } | null;
    recipeBreakdowns: ReadonlyArray<RecipeCostBreakdown>;
    operationalItems: ReadonlyArray<OperationalLineItem>;
    settings: SettingsCosts | null;
    pageState: UIState;
    pageMessage: { kind: 'error' | 'empty'; title: string; detail: string; actionLabel?: string } | null;
  };

  type ActionResult = {
    actionType?: 'sendWhatsapp' | 'markSent';
    error?: string;
    waUrl?: string;
  };

  let { data, form }: { data: PageData; form: ActionResult | null } = $props();
  let lastOpenedWaUrl = $state('');

  const budgetsPath = route('/budgets');

  const getEditPath = () => {
    const id = data.budget?.id;
    const base = resolve as unknown as (path: string) => string;
    return id ? base(`/budgets/${id}/update`) : '';
  };

  const formatDate = (value: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR');
  };

  const totalIngredients = $derived(
    data.recipeBreakdowns.reduce((sum, recipe) => sum + recipe.recipeTotal, 0)
  );

  const totalOperatives = $derived(
    data.operationalItems.reduce((sum, item) => sum + item.subtotal, 0)
  );

  const displayMargin = $derived(
    data.settings?.meal_plan_margin
      ? (data.settings.meal_plan_margin * 100).toLocaleString('es-AR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        })
      : '0'
  );

  const canSendWhatsapp = $derived(data.budget?.status === 'draft' && !form?.waUrl);

  const enhanceWithFeedback = () => {
    return async () => {
      void showBlockingLoader();

      return async ({ result }: { result: import('@sveltejs/kit').ActionResult }) => {
        await closeBlockingLoader();
        await applyAction(result);
        await presentActionFeedback(result);
      };
    };
  };

  $effect(() => {
    const waUrl = form?.waUrl;
    if (!browser || !waUrl || waUrl === lastOpenedWaUrl) return;
    lastOpenedWaUrl = waUrl;
    window.open(waUrl, 'whatsapp_compose');
  });
</script>

<svelte:head>
  <title>Preview Presupuesto</title>
</svelte:head>

{#if data.pageState === 'error' && data.pageMessage}
  <FormShell
    title="Error"
    description={data.pageMessage.detail}
    state="error"
    showPrimary={false}
  >
    <div class="actions">
      <Button href={budgetsPath} color="light">Volver a presupuestos</Button>
    </div>
  </FormShell>
{:else if data.budget}
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-12">
    <div class="space-y-4 xl:col-span-8">
      <Card size="xl" class="w-full p-6 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="mt-1 text-2xl font-semibold text-gray-900">Presupuesto para {data.budget.tutor?.full_name ?? 'Sin tutor'}</p>
            <div class="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <StatusBadge status={data.budget.status as BudgetStatus} />
              <span>Creado: {formatDate(data.budget.created_at)}</span>
              <span>Vence: {formatDate(data.budget.expires_at)}</span>
            </div>
          </div>

          <div class="flex min-w-56 flex-col items-stretch gap-2">
            {#if canSendWhatsapp}
              <Button href={getEditPath()} color="light">Editar</Button>
              <form method="POST" action="?/sendWhatsapp" use:enhance={enhanceWithFeedback()}>
                <Button type="submit" class="w-full">Enviar WhatsApp</Button>
              </form>
            {:else if form?.waUrl}
              <Button href={form.waUrl} target="whatsapp_compose">Abrir WhatsApp</Button>
              <p class="text-xs text-gray-500">Enviado. Si cerraste WhatsApp, podés abrirlo de nuevo.</p>
            {:else}
              <p class="text-xs text-gray-500">Envío por WhatsApp disponible solo en estado borrador.</p>
            {/if}
          </div>
        </div>
      </Card>

      <Card size="xl" class="w-full p-6 shadow-sm">
        <h3 class="text-xl font-semibold text-gray-900">Desglose de materias primas</h3>
        {#each data.recipeBreakdowns as recipe (recipe.recipeId)}
          <div class="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <div class="flex flex-wrap items-center justify-between gap-2 bg-gray-50 px-4 py-3">
              <strong class="text-lg text-gray-900">{recipe.recipeName}</strong>
              <div class="flex items-center gap-3 text-sm text-gray-700">
                <span>{recipe.assignedDays} días</span>
                <span class="font-semibold text-primary-700">{formatArs(recipe.recipeTotal)}</span>
              </div>
            </div>

            <div class="overflow-x-auto">
              <Table hoverable striped>
                <TableHead>
                  <TableHeadCell>Materia prima</TableHeadCell>
                  <TableHeadCell>Cantidad/día</TableHeadCell>
                  <TableHeadCell>Costo unit.</TableHeadCell>
                  <TableHeadCell>Subtotal ({recipe.assignedDays} días)</TableHeadCell>
                </TableHead>
                <TableBody>
                  {#each recipe.items as item (item.materialId)}
                    <TableBodyRow>
                      <TableBodyCell>{item.materialName}</TableBodyCell>
                      <TableBodyCell class="text-right tabular-nums">{formatQuantity(item.dailyQuantity)} {item.baseUnit}</TableBodyCell>
                      <TableBodyCell class="text-right tabular-nums">{formatArs(item.unitCost)}</TableBodyCell>
                      <TableBodyCell class="text-right tabular-nums">{formatArs(item.subtotal)}</TableBodyCell>
                    </TableBodyRow>
                  {/each}
                </TableBody>
              </Table>
            </div>
          </div>
        {/each}

        <div class="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-semibold text-gray-900">
          <span>Total ingredientes:</span>
          <span class="text-primary-700">{formatArs(totalIngredients)}</span>
        </div>
      </Card>

      <Card size="xl" class="w-full p-6 shadow-sm">
        <h3 class="text-xl font-semibold text-gray-900">Desglose de costos operativos</h3>
        <div class="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <Table hoverable striped>
            <TableHead>
              <TableHeadCell>Item</TableHeadCell>
              <TableHeadCell>Cantidad</TableHeadCell>
              <TableHeadCell>Costo unit.</TableHeadCell>
              <TableHeadCell>Subtotal</TableHeadCell>
            </TableHead>
            <TableBody>
              {#each data.operationalItems as item (item.name)}
                <TableBodyRow>
                  <TableBodyCell>{item.name}</TableBodyCell>
                  <TableBodyCell class="text-right tabular-nums">{formatQuantity(item.quantity)}</TableBodyCell>
                  <TableBodyCell class="text-right tabular-nums">{formatArs(item.unitCost)}</TableBodyCell>
                  <TableBodyCell class="text-right tabular-nums">{formatArs(item.subtotal)}</TableBodyCell>
                </TableBodyRow>
              {/each}
            </TableBody>
          </Table>
        </div>

        <div class="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 text-sm font-semibold text-gray-900">
          <span>Total operativos:</span>
          <span class="text-primary-700">{formatArs(totalOperatives)}</span>
        </div>
      </Card>

      {#if data.budget.notes}
        <Card size="xl" class="w-full p-6 shadow-sm">
          <h3 class="text-lg font-semibold text-gray-900">Notas</h3>
          <p class="mt-2 whitespace-pre-wrap text-sm text-gray-700">{data.budget.notes}</p>
        </Card>
      {/if}
    </div>

    <div class="xl:col-span-4">
      <Card size="xl" class="w-full border bg-primary p-6 shadow-sm xl:sticky xl:top-4">
        <p class="text-xs font-bold uppercase tracking-[0.14em] text-gray-200">Resumen financiero</p>

        <div class="mt-3 space-y-2 text-gray-300">
          <div class="flex items-center justify-between">
            <span>Ingredientes:</span>
            <span class="tabular-nums">{formatArs(data.budget.ingredient_total_global)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Costos operativos:</span>
            <span class="tabular-nums">{formatArs(data.budget.operational_total_global)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Costo total:</span>
            <span class="tabular-nums">{formatArs(data.budget.total_cost)}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Ganancia ({displayMargin}%):</span>
            <span class="tabular-nums">{formatArs(data.budget.total_cost * data.budget.applied_margin)}</span>
          </div>
        </div>

        <div class="mt-4 border-t border-primary-100 pt-4">
          <div class="flex items-end justify-between gap-2">
            <span class="text-xl font-semibold text-gray-300">Precio de venta</span>
            <strong class="text-2xl font-bold text-gray-300">{formatArs(data.budget.final_sale_price)}</strong>
          </div>
        </div>
      </Card>
    </div>
  </div>
{/if}
