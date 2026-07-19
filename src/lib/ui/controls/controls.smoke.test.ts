// Shallow render smoke tests. zag machines lean on focus management and
// getBoundingClientRect, which happy-dom stubs poorly — interaction depth
// lives in scripts/e2e.mjs, not here.
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { InspectorField } from '../../core/registry/types.js';
import NumberControl from './NumberControl.svelte';
import PaddingControl from './PaddingControl.svelte';
import SliderControl from './SliderControl.svelte';

let target: HTMLElement;
let instance: Record<string, unknown> | null = null;

function render(
	component: typeof NumberControl,
	field: InspectorField,
	value: unknown,
	setValue: (v: unknown) => void = () => {}
) {
	target = document.createElement('div');
	document.body.appendChild(target);
	instance = mount(component, { target, props: { field, value, setValue } });
	flushSync();
}

afterEach(() => {
	if (instance) unmount(instance);
	instance = null;
	target.remove();
});

describe('NumberControl', () => {
	it('renders the value, unit, and stepper triggers', () => {
		render(
			NumberControl,
			{ key: 'size', label: 'Size', control: 'number', unit: 'px' },
			19
		);
		const input = target.querySelector<HTMLInputElement>('input');
		expect(input?.value).toBe('19');
		expect(target.textContent).toContain('px');
		expect(target.querySelectorAll('button')).toHaveLength(2);
	});
});

describe('SliderControl', () => {
	it('renders thumb, hidden input, and value text with unit', () => {
		render(
			SliderControl,
			{ key: 'width', label: 'Width', control: 'slider', min: 10, max: 100, unit: '%' },
			55
		);
		expect(target.querySelector('[data-part="thumb"]')).toBeTruthy();
		expect(target.querySelector<HTMLInputElement>('input')?.value).toBe('55');
		expect(target.textContent).toContain('55%');
	});
});

describe('PaddingControl', () => {
	it('renders four side inputs and starts linked for uniform padding', () => {
		render(
			PaddingControl,
			{ key: 'padding', label: 'Padding', control: 'padding' },
			{ top: 10, right: 10, bottom: 10, left: 10 }
		);
		expect(target.querySelectorAll('input')).toHaveLength(4);
		const lock = target.querySelector<HTMLButtonElement>('.sme-padding-lock');
		expect(lock?.getAttribute('aria-pressed')).toBe('true');
		lock?.click();
		flushSync();
		expect(lock?.getAttribute('aria-pressed')).toBe('false');
	});

	it('starts unlinked for non-uniform padding', () => {
		render(
			PaddingControl,
			{ key: 'padding', label: 'Padding', control: 'padding' },
			{ top: 10, right: 0, bottom: 20, left: 0 }
		);
		const lock = target.querySelector<HTMLButtonElement>('.sme-padding-lock');
		expect(lock?.getAttribute('aria-pressed')).toBe('false');
	});
});
