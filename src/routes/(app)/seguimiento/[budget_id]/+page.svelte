<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Badge, Button, Card, Input, Label, Select, Textarea } from 'flowbite-svelte';
  import { formatArs } from '$lib/shared/currency';
  import DeliveryAlertBanner from '$lib/components/delivery/DeliveryAlertBanner.svelte';
  import { closeBlockingLoader, confirmAlert, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';

  type RecipeTracking = {
    budgetDogRecipeId: string;
    dogName: string;
    recipeName: string;
    assignedDays: number;
    preparedDays: number;
    deliveredDays: number;
    pendingPreparationDays: number;
    pendingDeliveryDays: number;
    preparedPct: number;
    deliveredPct: number;
  };

  type DeliveryAlert = {
    budgetId: string;
    budgetReferenceMonth: string;
    dogId: string;
    dogName: string;
    tutorName: string;
    recipeId: string;
    recipeName: string;
    budgetDogRecipeId: string;
    assignedDays: number;
    dayOfMonth: number;
    pct: number;
    totalMealsForPortion: number;
    deliveredMeals: number;
    remainingMeals: number;
    daysUntil: number;
  };

  type PageData = {
    budget: {
      id: string;
      status: string;
      tutorName: string;
      acceptedAt: string | null;
      totalPrice: number;
    };
    dogs: Array<{
      dogName: string;
      totalAssignedDays: number;
      recipes: Array<RecipeTracking>;
    }>;
    recipeOptions: Array<{ budgetDogRecipeId: string; label: string }>;
    preparations: Array<{
      id: string;
      budget_dog_recipe_id: string;
      recipe_days: number;
      prepared_at: string;
      notes: string | null;
      recipeName: string;
    }>;
    deliveries: Array<{
      id: string;
      budget_dog_recipe_id: string;
      recipe_days: number;
      delivered_at: string;
      notes: string | null;
      recipeName: string;
    }>;
    payments: Array<{
      id: string;
      amount: number;
      payment_method: 'cash' | 'transfer' | 'mercadopago' | 'other';
      paid_at: string;
      notes: string | null;
    }>;
    paymentSummary: {
      totalPrice: number;
      paidAmount: number;
      pendingAmount: number;
    };
    deliveryAlerts: DeliveryAlert[];
  };

  let { data }: { data: PageData } = $props();

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    mercadopago: 'MercadoPago',
    other: 'Otro'
  };

  const formatDate = (value: string | null): string => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR');
  };

  const isClosed = $derived(data.budget.status === 'closed');

  const enhanceWithFeedback = (confirmOptions?: {
    title: string;
    text: string;
    confirmButtonText: string;
  }) => {
    return async ({ cancel }: { cancel: () => void }) => {
      if (confirmOptions) {
        const confirmed = await confirmAlert(confirmOptions);
        if (!confirmed) {
          cancel();
          return;
        }
      }

      void showBlockingLoader();

      return async ({ result }: { result: import('@sveltejs/kit').ActionResult }) => {
        await closeBlockingLoader();
        await applyAction(result);
        await presentActionFeedback(result);
      };
    };
  };
</script>

<DeliveryAlertBanner alerts={data.deliveryAlerts} showLink={false} />

<section class="grid grid-cols-1 gap-4 xl:grid-cols-12">
  <Card size="xl" class="p-6 shadow-sm xl:col-span-12">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-gray-600">Seguimiento de presupuesto</p>
        <h2 class="mt-1 text-xl font-bold text-gray-900">{data.budget.tutorName}</h2>
        <p class="text-sm text-gray-500">Aceptado: {formatDate(data.budget.acceptedAt)}</p>
      </div>
      {#if isClosed}
        <Badge color="gray">Cerrado</Badge>
      {:else}
        <form method="POST" action="?/close" use:enhance={enhanceWithFeedback()}>
          <Button type="submit" color="secondary" size="xs">Cerrar presupuesto</Button>
        </form>
      {/if}
    </div>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-lg bg-gray-50 p-3">
        <p class="text-xs uppercase tracking-wide text-gray-500">Total</p>
        <p class="text-lg font-semibold text-gray-900">{formatArs(data.paymentSummary.totalPrice)}</p>
      </div>
      <div class="rounded-lg bg-accent-50 p-3">
        <p class="text-xs uppercase tracking-wide text-gray-500">Cobrado</p>
        <p class="text-lg font-semibold text-accent-700">{formatArs(data.paymentSummary.paidAmount)}</p>
      </div>
      <div class="rounded-lg bg-secondary-50 p-3">
        <p class="text-xs uppercase tracking-wide text-gray-500">Saldo</p>
        <p class="text-lg font-semibold text-secondary-700">{formatArs(data.paymentSummary.pendingAmount)}</p>
      </div>
    </div>

    <div class="mt-6 border-t border-gray-200 pt-4">
      <p class="mb-4 text-sm font-semibold text-gray-900">Progreso por receta</p>
      <div class="space-y-4">
        {#each data.dogs as dog (`dog-${dog.dogName}`)}
          <div class="rounded-lg border border-gray-200 p-4">
            <p class="font-semibold text-gray-900">{dog.dogName} · {dog.totalAssignedDays} días</p>
            <div class="mt-3 space-y-4">
              {#each dog.recipes as recipe (recipe.budgetDogRecipeId)}
                <div class="rounded-md bg-gray-50 p-3">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-medium text-gray-900">{recipe.recipeName}</p>
                    <Badge color="gray">{recipe.assignedDays} días</Badge>
                  </div>

                  <div class="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <p class="text-xs text-gray-600">Preparado: {recipe.preparedDays}/{recipe.assignedDays} ({recipe.preparedPct}%)</p>
                      <div class="mt-1 h-2 rounded-full bg-gray-200">
                        <div class="h-2 rounded-full bg-primary-500" style={`width: ${recipe.preparedPct}%`}></div>
                      </div>
                      <p class="mt-1 text-xs text-gray-500">Resta: {recipe.pendingPreparationDays} días</p>
                    </div>

                    <div>
                      <p class="text-xs text-gray-600">Entregado: {recipe.deliveredDays}/{recipe.assignedDays} ({recipe.deliveredPct}%)</p>
                      <div class="mt-1 h-2 rounded-full bg-gray-200">
                        <div class="h-2 rounded-full bg-accent-500" style={`width: ${recipe.deliveredPct}%`}></div>
                      </div>
                      <p class="mt-1 text-xs text-gray-500">Resta: {recipe.pendingDeliveryDays} días</p>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </Card>

  {#if !isClosed}
  <Card size="xl" class="p-6 shadow-sm xl:col-span-4">
    <p class="text-sm font-semibold text-gray-900">Registrar cobro</p>
    <form method="POST" action="?/addPayment" class="mt-3 space-y-3" use:enhance={enhanceWithFeedback()}>
      <div>
        <Label for="amount">Monto</Label>
        <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
      </div>
      <div>
        <Label for="paymentMethod">Medio de pago</Label>
        <Select id="paymentMethod" name="paymentMethod" required>
          <option value="cash">Efectivo</option>
          <option value="transfer">Transferencia</option>
          <option value="mercadopago">MercadoPago</option>
          <option value="other">Otro</option>
        </Select>
      </div>
      <div>
        <Label for="paidAt">Fecha</Label>
        <Input id="paidAt" name="paidAt" type="date" required />
      </div>
      <div>
        <Label for="paymentNotes">Notas</Label>
        <Textarea id="paymentNotes" name="notes" rows={3} class="w-full" />
      </div>
      <Button type="submit">Registrar cobro</Button>
    </form>
  </Card>

  <Card size="xl" class="p-6 shadow-sm xl:col-span-4">
    <p class="text-sm font-semibold text-gray-900">Registrar preparación</p>
    <form method="POST" action="?/addPreparation" class="mt-3 space-y-3" use:enhance={enhanceWithFeedback()}>
      <div>
        <Label for="preparationRecipe">Receta</Label>
        <Select id="preparationRecipe" name="budgetDogRecipeId" required>
          {#each data.recipeOptions as option (option.budgetDogRecipeId)}
            <option value={option.budgetDogRecipeId}>{option.label}</option>
          {/each}
        </Select>
      </div>
      <div>
        <Label for="preparationDays">Días preparados</Label>
        <Input id="preparationDays" name="recipeDays" type="number" min="1" step="1" required />
      </div>
      <div>
        <Label for="preparationDate">Fecha</Label>
        <Input id="preparationDate" name="entryDate" type="date" required />
      </div>
      <div>
        <Label for="preparationNotes">Notas</Label>
        <Textarea id="preparationNotes" name="notes" rows={3} class="w-full" />
      </div>
      <Button type="submit">Registrar preparación</Button>
    </form>
  </Card>

  <Card size="xl" class="p-6 shadow-sm xl:col-span-4">
    <p class="text-sm font-semibold text-gray-900">Registrar entrega</p>
    <form method="POST" action="?/addDelivery" class="mt-3 space-y-3" use:enhance={enhanceWithFeedback()}>
      <div>
        <Label for="deliveryRecipe">Receta</Label>
        <Select id="deliveryRecipe" name="budgetDogRecipeId" required>
          {#each data.recipeOptions as option (option.budgetDogRecipeId)}
            <option value={option.budgetDogRecipeId}>{option.label}</option>
          {/each}
        </Select>
      </div>
      <div>
        <Label for="deliveryDays">Días entregados</Label>
        <Input id="deliveryDays" name="recipeDays" type="number" min="1" step="1" required />
      </div>
      <div>
        <Label for="deliveryDate">Fecha</Label>
        <Input id="deliveryDate" name="entryDate" type="date" required />
      </div>
      <div>
        <Label for="deliveryNotes">Notas</Label>
        <Textarea id="deliveryNotes" name="notes" rows={3} class="w-full" />
      </div>
      <Button type="submit">Registrar entrega</Button>
    </form>
  </Card>
  {/if}

  <Card size="xl" class="p-6 shadow-sm xl:col-span-4">
    <p class="text-sm font-semibold text-gray-900">Cobros registrados</p>
    <div class="mt-3 space-y-2">
      {#if data.payments.length === 0}
        <p class="text-sm text-gray-500">Sin cobros registrados.</p>
      {:else}
        {#each data.payments as payment (payment.id)}
          <div class="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-200 p-2 text-sm">
            <div>
              <p class="font-medium">{formatArs(payment.amount)} · {paymentMethodLabels[payment.payment_method] ?? payment.payment_method}</p>
              <p class="text-xs text-gray-500">{formatDate(payment.paid_at)}{payment.notes ? ` · ${payment.notes}` : ''}</p>
            </div>
            {#if !isClosed}
            <form
              method="POST"
              action="?/deletePayment"
              use:enhance={enhanceWithFeedback({
                title: 'Eliminar cobro',
                text: 'Esta accion quitara el cobro registrado.',
                confirmButtonText: 'Si, eliminar'
              })}
            >
              <input type="hidden" name="paymentId" value={payment.id} />
              <Button type="submit" size="xs" color="red">Eliminar</Button>
            </form>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </Card>

  <Card size="xl" class="p-6 shadow-sm xl:col-span-4">
    <p class="text-sm font-semibold text-gray-900">Preparaciones registradas</p>
    <div class="mt-3 space-y-2">
      {#if data.preparations.length === 0}
        <p class="text-sm text-gray-500">Sin preparaciones registradas.</p>
      {:else}
        {#each data.preparations as preparation (preparation.id)}
          <div class="rounded border border-gray-200 p-2 text-xs">
            <p class="font-medium">{preparation.recipeName} · {preparation.recipe_days} días</p>
            <p class="text-xs text-gray-500">{formatDate(preparation.prepared_at)}</p>
            {#if preparation.notes}<p class="text-gray-500">{preparation.notes}</p>{/if}
            {#if !isClosed}
            <form
              method="POST"
              action="?/deletePreparation"
              class="mt-1"
              use:enhance={enhanceWithFeedback({
                title: 'Eliminar preparacion',
                text: 'Esta accion eliminara el registro de preparacion.',
                confirmButtonText: 'Si, eliminar'
              })}
            >
              <input type="hidden" name="preparationId" value={preparation.id} />
              <Button type="submit" size="xs" color="red">Eliminar</Button>
            </form>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </Card>

  <Card size="xl" class="p-6 shadow-sm xl:col-span-4">
    <p class="text-sm font-semibold text-gray-900">Entregas registradas</p>
    <div class="mt-3 space-y-2">
      {#if data.deliveries.length === 0}
        <p class="text-sm text-gray-500">Sin entregas registradas.</p>
      {:else}
        {#each data.deliveries as delivery (delivery.id)}
          <div class="rounded border border-gray-200 p-2 text-xs">
            <p class="font-medium">{delivery.recipeName} · {delivery.recipe_days} días</p>
            <p class="text-xs text-gray-500">{formatDate(delivery.delivered_at)}</p>
            {#if delivery.notes}<p class="text-gray-500">{delivery.notes}</p>{/if}
            {#if !isClosed}
            <form
              method="POST"
              action="?/deleteDelivery"
              class="mt-1"
              use:enhance={enhanceWithFeedback({
                title: 'Eliminar entrega',
                text: 'Esta accion eliminara el registro de entrega.',
                confirmButtonText: 'Si, eliminar'
              })}
            >
              <input type="hidden" name="deliveryId" value={delivery.id} />
              <Button type="submit" size="xs" color="red">Eliminar</Button>
            </form>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </Card>
</section>
