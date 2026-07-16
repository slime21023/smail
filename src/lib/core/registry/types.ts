import type { Component } from 'svelte';

/** Control kinds the Inspector knows how to render (spec §7.3). */
export type InspectorControl =
	| 'text'
	| 'textarea'
	| 'number'
	| 'color'
	| 'select'
	| 'segment'
	| 'padding';

export interface InspectorField {
	/** Prop key this field edits. */
	key: string;
	label: string;
	control: InspectorControl;
	/** For 'select' / 'segment'. */
	options?: string[];
	/** For 'number'. */
	min?: number;
	max?: number;
	step?: number;
}

/**
 * A registered block type: how to create it, edit it, and serialize it (spec §8.4).
 */
export interface BlockDefinition<P = Record<string, unknown>> {
	type: string;
	label: string;
	defaultProps: P;
	inspector: InspectorField[];
	/** Serialize props to an MJML fragment. Must be pure and deterministic. */
	toMjml: (props: P) => string;
	/** Edit-mode preview component rendered inside the canvas. */
	render?: Component<{ props: P }>;
}

export function defineBlock<P>(definition: BlockDefinition<P>): BlockDefinition<P> {
	return definition;
}
