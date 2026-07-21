import { describe, expect, it } from 'vitest';
import { getWheelAdjustedValue } from './wheel.js';

describe('getWheelAdjustedValue', () => {
	it('increments on wheel up and decrements on wheel down', () => {
		expect(getWheelAdjustedValue(10, -100, { step: 5 })).toBe(15);
		expect(getWheelAdjustedValue(10, 100, { step: 5 })).toBe(5);
	});

	it('respects min, max, and decimal steps', () => {
		expect(getWheelAdjustedValue(10, -1, { min: 0, max: 10, step: 1 })).toBe(10);
		expect(getWheelAdjustedValue(0, 1, { min: 0, step: 1 })).toBe(0);
		expect(getWheelAdjustedValue(1.2, -1, { step: 0.1 })).toBe(1.3);
	});
});
