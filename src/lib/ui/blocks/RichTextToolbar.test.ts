import { afterEach, describe, expect, it } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import { DEFAULT_DELIMITERS } from '../../core/params/params.js';
import type { ParameterDef } from '../../core/schema/types.js';
import { EDITOR_CTX, type EditorContext } from '../context.js';
import RichTextToolbar from './RichTextToolbar.svelte';

let target: HTMLElement;
let instance: Record<string, unknown> | null = null;

function render(
	parameters: ParameterDef[],
	createParameter: EditorContext['createParameter'],
	oninsertparam: (key: string) => void = () => {}
) {
	target = document.createElement('div');
	document.body.appendChild(target);
	instance = mount(RichTextToolbar, {
		target,
		props: {
			oncmd: () => {},
			onblock: () => {},
			onlink: () => {},
			oninsertparam,
			onsaverange: () => {}
		},
		context: new Map([[EDITOR_CTX, { parameters, delimiters: DEFAULT_DELIMITERS, createParameter }]])
	});
	flushSync();
}

afterEach(() => {
	if (instance) unmount(instance);
	instance = null;
	target.remove();
});

describe('RichTextToolbar parameters', () => {
	it('always exposes the parameter picker, including when empty', () => {
		render([], () => null);
		const button = target.querySelector<HTMLButtonElement>('[aria-label="Insert parameter"]');
		expect(button).toBeTruthy();
		button?.click();
		flushSync();
		expect(target.querySelector('[aria-label="Search or create parameter"]')).toBeTruthy();
	});

	it('inserts a host-provided parameter and creates a new parameter', () => {
		const inserted: string[] = [];
		let createdKey = '';
		render(
			[{ key: 'firstName', label: 'First name' }],
			(key) => {
				createdKey = key;
				return { key, label: key };
			},
			(key) => inserted.push(key)
		);
		target.querySelector<HTMLButtonElement>('[aria-label="Insert parameter"]')?.click();
		flushSync();
		target.querySelector<HTMLButtonElement>('.sme-rt-parameter-option')?.click();
		flushSync();
		expect(inserted).toEqual(['firstName']);

		target.querySelector<HTMLButtonElement>('[aria-label="Insert parameter"]')?.click();
		flushSync();
		const input = target.querySelector<HTMLInputElement>('[aria-label="Search or create parameter"]')!;
		input.value = 'couponCode';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		flushSync();
		target.querySelector<HTMLButtonElement>('.sme-rt-parameter-create')?.click();
		flushSync();
		expect(createdKey).toBe('couponCode');
		expect(inserted).toEqual(['firstName', 'couponCode']);
	});
});
