import type { SelectOption } from './types.js';

/** Normalize `options` entries: plain strings become `{ label: s, value: s }`. */
export function normalizeOptions(options?: (string | SelectOption)[]): SelectOption[] {
	return (options ?? []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
}
