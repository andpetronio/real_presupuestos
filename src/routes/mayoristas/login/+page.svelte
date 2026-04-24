<script lang="ts">
  import { Alert, Button, Card, Input, Label } from "flowbite-svelte";

  type FormState = {
    operatorError?: string;
    code?: string;
  };

  let { form }: { form: FormState | null } = $props();

  let submitting = $state(false);

  const handleSubmit = () => {
    submitting = true;
  };
</script>

<svelte:head>
  <title>Mayoristas · Ingreso</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-6 sm:py-10">
  <div class="w-full max-w-md">
    <Card size="xl" class="w-full p-5 shadow-sm sm:p-6">
      <div class="mb-4 flex justify-center">
        <img
          src="/logo.png"
          alt="Real, Amor en cada bocado"
          class="h-16 w-auto sm:h-20"
          loading="eager"
          decoding="async"
        />
      </div>
      <p class="text-xs font-bold uppercase tracking-[0.14em] text-primary-700">Marketplace mayorista</p>
      <h1 class="mt-1 text-2xl font-bold text-gray-900">Ingresar con código</h1>
      <p class="mt-1 text-sm text-gray-600">Usá tu código único de cliente para acceder al catálogo.</p>

      {#if form?.operatorError}
        <Alert color="red" class="mt-4" role="alert">{form.operatorError}</Alert>
      {/if}

      <form method="POST" action="?/loginByCode" class="mt-5 space-y-4" onsubmit={handleSubmit}>
        <div class="grid gap-1.5">
          <Label for="code">Código de cliente</Label>
          <Input
            id="code"
            name="code"
            class="text-base uppercase"
            required
            maxlength={24}
            autocapitalize="characters"
            spellcheck={false}
            value={form?.code ?? ""}
            placeholder="Ej: ABCD72KQ"
          />
        </div>

        <Button type="submit" class="h-11 w-full text-base font-semibold" disabled={submitting} aria-busy={submitting}>
          {submitting ? "Ingresando…" : "Ingresar"}
        </Button>
      </form>
    </Card>
  </div>
</main>
