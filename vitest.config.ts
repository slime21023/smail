import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
		// mjml-browser needs a DOM at import time
		environment: 'happy-dom'
	}
});
