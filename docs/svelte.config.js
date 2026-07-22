import adapter from '@sveltejs/adapter-static';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const docsRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	kit: {
		adapter: adapter({
			assets: resolve(docsRoot, 'build'),
			pages: resolve(docsRoot, 'build')
		}),
		paths: {
			base: process.env.BASE_PATH ?? ''
		},
		prerender: {
			entries: ['*']
		}
	}
};

export default config;
