<script lang='ts'>
  import { Input, Label } from 'flowbite-svelte';
  import type { WholesalerCategoryFormValues } from '$lib/types/view-models/wholesaler-categories';

  type Props = {
    values: WholesalerCategoryFormValues;
  };

  let { values }: Props = $props();
</script>

<div>
  <Label for='name' class='mb-1'>Nombre</Label>
  <Input id='name' name='name' required value={values.name} />
</div>
