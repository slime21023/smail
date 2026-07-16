import { describe, expect, it } from 'vitest';
import { compile } from './compile.js';

describe('compile', () => {
	it('compiles valid MJML to email HTML', async () => {
		const result = await compile(
			'<mjml><mj-body><mj-section><mj-column><mj-text>Hello</mj-text></mj-column></mj-section></mj-body></mjml>'
		);
		expect(result.errors).toEqual([]);
		expect(result.html).toContain('<!doctype html>');
		expect(result.html).toContain('Hello');
	});

	it('reports invalid elements as soft errors instead of throwing', async () => {
		const result = await compile(
			'<mjml><mj-body><mj-section><mj-column><mj-bogus /></mj-column></mj-section></mj-body></mjml>'
		);
		expect(result.errors.length).toBeGreaterThan(0);
		expect(result.html).toBeTypeOf('string');
	});

	it('returns cached result for identical input', async () => {
		const mjml =
			'<mjml><mj-body><mj-section><mj-column><mj-text>Cache me</mj-text></mj-column></mj-section></mj-body></mjml>';
		const first = await compile(mjml);
		const second = await compile(mjml);
		expect(second).toBe(first);
	});
});
