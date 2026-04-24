<script lang="ts">
  import { Alert, Button, Card, Input, Label } from 'flowbite-svelte';

  let { data, form } = $props<{
    data: {
      nextPath: string;
    };
    form?: {
      operatorError?: string;
      email?: string;
      nextPath?: string;
    };
  }>();

  const nextPath = $derived(form?.nextPath ?? data.nextPath);
  let isSubmitting = $state(false);

  const handleSubmit = () => {
    isSubmitting = true;
  };
</script>

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
      <h1 class="mt-1 text-2xl font-bold text-gray-900 text-center">Iniciar sesión</h1>

      {#if form?.operatorError}
        <Alert color="red" class="mt-4" role="alert">{form.operatorError}</Alert>
      {/if}

      <form method="POST" action="?/login" class="mt-5 space-y-4" novalidate onsubmit={handleSubmit}>
        <input type="hidden" name="next" value={nextPath} />

        <div class="grid gap-1.5">
          <Label for="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            class="text-base"
            inputmode="email"
            autocapitalize="none"
            autocomplete="email"
            spellcheck={false}
            required
            value={form?.email ?? ''}
          />
        </div>

        <div class="grid gap-1.5">
          <Label for="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="password"
            class="text-base"
            autocomplete="current-password"
            required
          />
        </div>

        <Button type="submit" class="h-11 w-full font-semibold bg-primary hover:bg-primary-600 text-white" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>
    </Card>
  </div>
</main>
