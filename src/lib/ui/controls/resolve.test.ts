import { describe, expect, it, vi } from 'vitest';
import type { Component } from 'svelte';
import type { ControlProps, InspectorField } from '../../core/registry/types.js';
import { builtinControls } from './registry.js';
import { resolveControl } from './resolve.js';
import TextControl from './TextControl.svelte';

const fakeControl = (() => {}) as unknown as Component<ControlProps>;
const field = (over: Partial<InspectorField>): InspectorField => ({
	key: 'k',
	label: 'K',
	control: 'text',
	...over
});

describe('resolveControl', () => {
	it('prefers the per-field component over everything', () => {
		expect(resolveControl(field({ control: 'color', component: fakeControl }))).toBe(fakeControl);
	});

	it('prefers editor-level controls over built-ins of the same name', () => {
		expect(resolveControl(field({ control: 'color' }), { color: fakeControl })).toBe(fakeControl);
	});

	it('resolves built-ins by name', () => {
		expect(resolveControl(field({ control: 'color' }))).toBe(builtinControls.color);
	});

	it('resolves custom names from the editor-level registry', () => {
		expect(resolveControl(field({ control: 'swatch' }), { swatch: fakeControl })).toBe(fakeControl);
	});

	it('falls back to text with a warning for unknown names', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(resolveControl(field({ control: 'nope' }))).toBe(TextControl);
		expect(warn).toHaveBeenCalledOnce();
		warn.mockRestore();
	});
});
