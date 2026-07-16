import type { MjmlError } from 'mjml-browser';

export interface CompileResult {
	html: string;
	errors: MjmlError[];
}

// mjml-browser touches `window` at import time, so it is loaded lazily via
// dynamic import. That keeps this module (and the package root) safe to
// import during SSR — only calling compile() requires a browser-like DOM.
let mjmlModule: Promise<typeof import('mjml-browser')> | undefined;

const cache = new Map<string, CompileResult>();
const CACHE_LIMIT = 100;

export async function compile(mjml: string): Promise<CompileResult> {
	const cached = cache.get(mjml);
	if (cached) return cached;

	mjmlModule ??= import('mjml-browser');
	const { default: mjml2html } = await mjmlModule;

	const { html, errors } = mjml2html(mjml, { validationLevel: 'soft' });
	const result: CompileResult = { html, errors };

	if (cache.size >= CACHE_LIMIT) cache.clear();
	cache.set(mjml, result);
	return result;
}
