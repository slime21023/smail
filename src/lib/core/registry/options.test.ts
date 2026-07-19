import { describe, expect, it } from 'vitest';
import { normalizeOptions } from './options.js';

describe('normalizeOptions', () => {
	it('returns [] for undefined', () => {
		expect(normalizeOptions()).toEqual([]);
	});

	it('maps plain strings to label === value', () => {
		expect(normalizeOptions(['left', 'center'])).toEqual([
			{ label: 'left', value: 'left' },
			{ label: 'center', value: 'center' }
		]);
	});

	it('passes {label, value} pairs through and supports mixed arrays', () => {
		expect(normalizeOptions(['left', { label: '置中', value: 'center' }])).toEqual([
			{ label: 'left', value: 'left' },
			{ label: '置中', value: 'center' }
		]);
	});
});
