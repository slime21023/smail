import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	// Compiles .svelte / .svelte.ts (runes) modules used by tests
	plugins: [svelte()],
	// Client build of svelte (mount/flushSync), not the SSR build
	resolve: { conditions: ['browser'] },
	test: {
		include: ['src/**/*.test.ts'],
		// mjml-browser needs a DOM at import time
		environment: 'happy-dom'
	}
});
