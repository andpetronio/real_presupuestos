<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import {
    Alert,
    Button,
    Card,
    Checkbox,
    Input,
    Label,
    Tabs,
    TabItem,
    Textarea
  } from 'flowbite-svelte';
  import type { SettingsFormValues, SettingsRow } from '$lib/server/settings/validation';
  import { closeBlockingLoader, presentActionFeedback, showBlockingLoader } from '$lib/shared/alerts';

  type PageData = {
    formState: 'success' | 'error';
    formMessage: {
      kind: 'success' | 'error';
      title: string;
      detail?: string;
    };
    settings: SettingsRow;
    settingsForm: SettingsFormValues;
  };

  type ActionData = {
    actionType?: 'update';
    operatorError?: string;
    operatorSuccess?: string;
    fieldErrors?: ReadonlyArray<string>;
    values?: SettingsFormValues;
  };

  let { data, form }: { data: PageData; form: ActionData | null } = $props();
  const values = $derived<SettingsFormValues>(form?.values ?? data.settingsForm);
  type SettingsTab = 'operativos' | 'comercial' | 'whatsapp' | 'encuesta' | 'cobros';
  let activeTab = $state<SettingsTab>('operativos');

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
</script>

<div class="mb-4"><!-- título en el layout --></div>

{#if data.formState === 'error'}
  <Alert color="red" class="mb-4">{data.formMessage.detail ?? 'No pudimos cargar configuración.'}</Alert>
{/if}

{#if form?.fieldErrors?.length}
  <Alert color="red" class="mb-4">
    <ul class="list-disc ps-4">
      {#each form.fieldErrors as error (error)}
        <li>{error}</li>
      {/each}
    </ul>
  </Alert>
{/if}

<Card size="xl" class="w-full p-6 md:p-8 shadow-sm">
  <form method="POST" action="?/update" class="space-y-6" use:enhance={enhanceWithFeedback()}>
    <input type="hidden" name="settingsSection" value={activeTab} />

    <Tabs bind:selected={activeTab} tabStyle="underline" classes={{ content: 'pt-6' }}>
      <TabItem key="operativos" title="Costos operativos">
        <section class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div class="grid gap-1"><Label for="vacuumBagSmallUnitCost">Costo bolsa al vacío chica</Label><Input id="vacuumBagSmallUnitCost" name="vacuumBagSmallUnitCost" type="number" min="0" step="0.01" required value={values.vacuumBagSmallUnitCost} /></div>
          <div class="grid gap-1"><Label for="vacuumBagLargeUnitCost">Costo bolsa al vacío grande</Label><Input id="vacuumBagLargeUnitCost" name="vacuumBagLargeUnitCost" type="number" min="0" step="0.01" required value={values.vacuumBagLargeUnitCost} /></div>
          <div class="grid gap-1"><Label for="labelUnitCost">Costo etiqueta</Label><Input id="labelUnitCost" name="labelUnitCost" type="number" min="0" step="0.01" required value={values.labelUnitCost} /></div>
          <div class="grid gap-1"><Label for="nonWovenBagUnitCost">Costo bolsa de friselina</Label><Input id="nonWovenBagUnitCost" name="nonWovenBagUnitCost" type="number" min="0" step="0.01" required value={values.nonWovenBagUnitCost} /></div>
          <div class="grid gap-1"><Label for="laborHourCost">Costo hora de mano de obra</Label><Input id="laborHourCost" name="laborHourCost" type="number" min="0" step="0.01" required value={values.laborHourCost} /></div>
          <div class="grid gap-1"><Label for="cookingHourCost">Costo hora de cocción</Label><Input id="cookingHourCost" name="cookingHourCost" type="number" min="0" step="0.01" required value={values.cookingHourCost} /></div>
          <div class="grid gap-1"><Label for="calciumUnitCost">Costo unitario calcio (u)</Label><Input id="calciumUnitCost" name="calciumUnitCost" type="number" min="0" step="0.01" required value={values.calciumUnitCost} /></div>
          <div class="grid gap-1"><Label for="kefirUnitCost">Costo unitario kefir (u)</Label><Input id="kefirUnitCost" name="kefirUnitCost" type="number" min="0" step="0.01" required value={values.kefirUnitCost} /></div>
          <div class="grid gap-1"><Label for="deliveryLogisticsCost">Costo logístico por entrega</Label><Input id="deliveryLogisticsCost" name="deliveryLogisticsCost" type="number" min="0" step="0.01" required value={values.deliveryLogisticsCost} /></div>
          </div>
        </section>
      </TabItem>

      <TabItem key="comercial" title="Comercial y reglas">
        <section class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div class="grid gap-1"><Label for="mealPlanMarginPercent">Margen comercial (%)</Label><Input id="mealPlanMarginPercent" name="mealPlanMarginPercent" type="number" min="0" max="90" step="0.01" required value={values.mealPlanMarginPercent} /></div>
          <div class="grid gap-1"><Label for="budgetValidityDays">Validez del presupuesto (días)</Label><Input id="budgetValidityDays" name="budgetValidityDays" type="number" min="1" max="90" step="1" required value={values.budgetValidityDays} /></div>
          <div class="grid gap-1"><Label for="defaultRequestedDays">Días sugeridos por presupuesto</Label><Input id="defaultRequestedDays" name="defaultRequestedDays" type="number" min="1" max="120" step="1" required value={values.defaultRequestedDays} /></div>
          <div class="grid gap-1"><Label for="minimumAdvanceDays">Anticipación mínima (días)</Label><Input id="minimumAdvanceDays" name="minimumAdvanceDays" type="number" min="0" max="30" step="1" required value={values.minimumAdvanceDays} /></div>
          <div class="grid gap-1"><Label for="maxDogsPerBudget">Máximo de perros por presupuesto</Label><Input id="maxDogsPerBudget" name="maxDogsPerBudget" type="number" min="1" max="12" step="1" required value={values.maxDogsPerBudget} /></div>
          </div>

          <div class="grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Checkbox name="autoExpireBudgets" checked={values.autoExpireBudgets}>Expirar presupuestos automáticamente cuando vence la fecha</Checkbox>
          <Checkbox name="showUnitCostsInPreview" checked={values.showUnitCostsInPreview}>Mostrar costos unitarios en la vista previa interna</Checkbox>
          <Checkbox name="requireInternalNotes" checked={values.requireInternalNotes}>Exigir nota interna antes de pasar a “Listo para enviar”</Checkbox>
          </div>
        </section>
      </TabItem>

      <TabItem key="whatsapp" title="WhatsApp y general">
        <section class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
          <div class="grid gap-1"><Label for="businessName">Nombre comercial</Label><Input id="businessName" name="businessName" type="text" required value={values.businessName} /></div>
          <div class="grid gap-1"><Label for="timezoneLabel">Zona horaria</Label><Input id="timezoneLabel" name="timezoneLabel" type="text" required placeholder="America/Argentina/Buenos_Aires" value={values.timezoneLabel} /></div>
          <div class="grid gap-1"><Label for="businessPhone">Teléfono de contacto</Label><Input id="businessPhone" name="businessPhone" type="text" placeholder="+54911..." value={values.businessPhone} /></div>
          <div class="grid gap-1"><Label for="businessEmail">Correo de contacto</Label><Input id="businessEmail" name="businessEmail" type="email" placeholder="hola@tuempresa.com" value={values.businessEmail} /></div>
          </div>

          <div class="grid gap-1">
          <Label for="whatsappDefaultTemplate">Mensaje base para envío</Label>
          <Textarea id="whatsappDefaultTemplate" name="whatsappDefaultTemplate" rows={10} class="w-full" placeholder="Hola, te compartimos la propuesta personalizada..." value={values.whatsappDefaultTemplate} />
          <p class="text-xs text-gray-500">
            Placeholders: {'{{tutor_nombre}}'}, {'{{perros}}'}, {'{{total_final}}'}, {'{{fecha_limite}}'}, {'{{mes_referencia}}'}, {'{{dias_referencia}}'}, {'{{nombre_emprendimiento}}'}, {'{{link_presupuesto}}'}, {'{{cbu_transferencia}}'}, {'{{alias_transferencia}}'}, {'{{titular_transferencia}}'}, {'{{proveedor_transferencia}}'}.
          </p>
          </div>

          <div>
          <Checkbox name="enableWhatsappNotifications" checked={values.enableWhatsappNotifications}>Activar envío de notificaciones por WhatsApp</Checkbox>
          </div>
        </section>
      </TabItem>

      <TabItem key="encuesta" title="Encuesta (opcional)">
        <section class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
          <div class="md:col-span-2">
            <Checkbox name="satisfactionSurveyEnabled" checked={values.satisfactionSurveyEnabled}>Activar invitación a encuesta luego del envío</Checkbox>
          </div>
          <div class="grid gap-1"><Label for="satisfactionSurveyUrl">Enlace de encuesta</Label><Input id="satisfactionSurveyUrl" name="satisfactionSurveyUrl" type="url" placeholder="https://..." value={values.satisfactionSurveyUrl} /></div>
          <div class="grid gap-1"><Label for="satisfactionSurveyMessage">Texto breve de invitación</Label><Input id="satisfactionSurveyMessage" name="satisfactionSurveyMessage" type="text" placeholder="Tu opinión nos ayuda a mejorar" value={values.satisfactionSurveyMessage} /></div>
          </div>
        </section>
      </TabItem>

      <TabItem key="cobros" title="Cobros">
        <section class="space-y-4">
          <p class="text-sm text-gray-600">Datos bancarios para recibir transferencias. Estos datos pueden incluirse en el mensaje de WhatsApp usando los placeholders.</p>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="grid gap-1">
              <Label for="bankProvider">Proveedor / Banco</Label>
              <Input id="bankProvider" name="bankProvider" type="text" placeholder="Naranja X" value={values.bankProvider} />
            </div>
            <div class="grid gap-1">
              <Label for="bankCbu">CBU (22 dígitos)</Label>
              <Input id="bankCbu" name="bankCbu" type="text" placeholder="4530000800018342656744" value={values.bankCbu} />
            </div>
            <div class="grid gap-1">
              <Label for="bankAlias">Alias</Label>
              <Input id="bankAlias" name="bankAlias" type="text" placeholder="REAL.ALIMENTO2" value={values.bankAlias} />
            </div>
            <div class="grid gap-1">
              <Label for="bankAccountHolder">Titular de la cuenta</Label>
              <Input id="bankAccountHolder" name="bankAccountHolder" type="text" placeholder="Maylin Martinez Muñoz" value={values.bankAccountHolder} />
            </div>
          </div>
        </section>
      </TabItem>
    </Tabs>

    <div class="flex justify-end border-t border-gray-200 pt-4">
      <Button type="submit">Guardar configuración</Button>
    </div>
  </form>
</Card>
