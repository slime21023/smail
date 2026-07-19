// Shallow render smoke tests. zag machines lean on focus management and
// getBoundingClientRect, which happy-dom stubs poorly — interaction depth
// lives in scripts/e2e.mjs, not here.
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_DELIMITERS } from '../../core/params/params.js';
import type { InspectorField } from '../../core/registry/types.js';
import type { SocialElement } from '../../core/schema/types.js';
import { EDITOR_CTX, type EditorContext } from '../context.js';
import ImageSrcControl from './ImageSrcControl.svelte';
import NumberControl from './NumberControl.svelte';
import PaddingControl from './PaddingControl.svelte';
import SliderControl from './SliderControl.svelte';
import SocialLinksControl from './SocialLinksControl.svelte';

let target: HTMLElement;
let instance: Record<string, unknown> | null = null;

function render(
	component: typeof NumberControl,
	field: InspectorField,
	value: unknown,
	setValue: (v: unknown) => void = () => {},
	context?: EditorContext
) {
	target = document.createElement('div');
	document.body.appendChild(target);
	instance = mount(component, {
		target,
		props: { field, value, setValue },
		context: context ? new Map([[EDITOR_CTX, context]]) : undefined
	});
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

describe('SocialLinksControl', () => {
	const twoRows: SocialElement[] = [
		{ network: 'facebook', href: 'https://facebook.com/acme' },
		{ network: 'x', href: 'https://x.com/acme' }
	];
	const field: InspectorField = { key: 'elements', label: 'Links', control: 'socialLinks' };

	it('renders one select + href input per row and an add button', () => {
		render(SocialLinksControl, field, twoRows);
		expect(target.querySelectorAll('select')).toHaveLength(2);
		expect(target.querySelectorAll('input[type="text"]')).toHaveLength(2);
		expect(target.querySelector('.sme-social-add')).toBeTruthy();
	});

	it('remove and add write new arrays through setValue', () => {
		let written: unknown;
		render(SocialLinksControl, field, twoRows, (v) => (written = v));
		target.querySelector<HTMLButtonElement>('[aria-label="Remove link"]')?.click();
		flushSync();
		expect(written).toEqual([twoRows[1]]);

		target.querySelector<HTMLButtonElement>('.sme-social-add')?.click();
		flushSync();
		expect(written).toEqual([...twoRows, { network: 'web', href: 'https://' }]);
	});
});

describe('ImageSrcControl', () => {
	const field: InspectorField = { key: 'src', label: 'Image URL', control: 'imageSrc' };

	it('renders a plain URL input without an editor context', () => {
		render(ImageSrcControl, field, 'https://img.example/a.png');
		expect(target.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe(
			'https://img.example/a.png'
		);
		expect(target.querySelector('.sme-upload-btn')).toBeNull();
	});

	it('offers Upload when the context provides onImageUpload', () => {
		render(ImageSrcControl, field, '', () => {}, {
			onImageUpload: async () => 'https://cdn.example/up.png',
			parameters: [],
			delimiters: DEFAULT_DELIMITERS
		});
		expect(target.querySelector('.sme-upload-btn')).toBeTruthy();
		expect(target.querySelector('.sme-upload-input')).toBeTruthy();
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
