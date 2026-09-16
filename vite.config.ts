import { defineConfig } from "vite";
import { sveltePhosphorOptimize } from "phosphor-svelte/vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [sveltePhosphorOptimize(), sveltekit()],
});
