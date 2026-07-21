import type { ParameterDef } from '../schema/types.js';

export type { ParameterDef };

export interface ParamDelimiters {
	open: string;
	close: string;
}

export const DEFAULT_DELIMITERS: ParamDelimiters = { open: '{{', close: '}}' };

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function placeholderPattern(delimiters: ParamDelimiters): RegExp {
	return new RegExp(
		`${escapeRegExp(delimiters.open)}\\s*([A-Za-z0-9_][A-Za-z0-9_.-]*)\\s*${escapeRegExp(delimiters.close)}`,
		'g'
	);
}

/** Whether a key can be used in a merge-field placeholder. */
export function isValidParameterKey(key: string): boolean {
	return /^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(key);
}

/**
 * Unique placeholder keys in first-occurrence order. To scan a whole document,
 * pass `serializeToMjml(state, registry)` — every user-visible string ends up
 * in the MJML output.
 */
export function extractParams(
	source: string,
	delimiters: ParamDelimiters = DEFAULT_DELIMITERS
): string[] {
	const keys: string[] = [];
	for (const match of source.matchAll(placeholderPattern(delimiters))) {
		if (!keys.includes(match[1])) keys.push(match[1]);
	}
	return keys;
}

/**
 * Replace placeholders whose key exists in `values`. Unmatched placeholders
 * are left intact, so partial substitution (and honest sample previews) work.
 */
export function substituteParams(
	source: string,
	values: Record<string, string>,
	delimiters: ParamDelimiters = DEFAULT_DELIMITERS
): string {
	return source.replace(placeholderPattern(delimiters), (whole, key: string) =>
		key in values ? values[key] : whole
	);
}

/** Merge declarations: prop entries win by key, doc-only entries appended after. */
export function mergeParams(
	docParams: ParameterDef[] | undefined,
	propParams: ParameterDef[] | undefined
): ParameterDef[] {
	const props = propParams ?? [];
	const docOnly = (docParams ?? []).filter((d) => !props.some((p) => p.key === d.key));
	return [...props, ...docOnly];
}
