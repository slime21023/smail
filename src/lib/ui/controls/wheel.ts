export interface NumericBounds {
	min?: number;
	max?: number;
	step?: number;
}

function precision(value: number): number {
	const parts = String(value).toLowerCase().split('e');
	const decimalPlaces = (parts[0].split('.')[1] ?? '').length;
	const exponent = Number(parts[1] ?? 0);
	return Math.max(0, decimalPlaces - exponent);
}

/** Returns the next bounded, step-aligned value for a vertical wheel movement. */
export function getWheelAdjustedValue(
	value: number,
	deltaY: number,
	{ min, max, step = 1 }: NumericBounds = {}
): number {
	if (!Number.isFinite(value) || deltaY === 0 || !Number.isFinite(step) || step <= 0) return value;

	const direction = deltaY < 0 ? 1 : -1;
	const next = value + direction * step;
	const bounded = Math.min(max ?? Infinity, Math.max(min ?? -Infinity, next));
	return Number(bounded.toFixed(precision(step)));
}
