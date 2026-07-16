import type { Padding } from '../schema/types.js';

/** Escape a string for use inside an XML attribute value or text node. */
export function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

export type AttrValue = string | number | undefined;

/**
 * Render an attribute list. Undefined values are skipped; key order follows
 * insertion order so output stays deterministic. Returns '' or a string with
 * a leading space, ready to concatenate after a tag name.
 */
export function attrs(values: Record<string, AttrValue>): string {
	let out = '';
	for (const [key, value] of Object.entries(values)) {
		if (value === undefined) continue;
		out += ` ${key}="${escapeXml(String(value))}"`;
	}
	return out;
}

export function px(value: number): string {
	return `${value}px`;
}

export function paddingValue(p: Padding): string {
	return `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`;
}

/** Indent every line of a block by `depth` levels (two spaces each). */
export function indent(text: string, depth: number): string {
	const pad = '  '.repeat(depth);
	return text
		.split('\n')
		.map((line) => (line ? pad + line : line))
		.join('\n');
}
