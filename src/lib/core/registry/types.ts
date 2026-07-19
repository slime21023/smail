import type { Component } from 'svelte';

/** Built-in control kinds the Inspector ships with (spec §7.3). */
export type BuiltinInspectorControl =
	| 'text'
	| 'textarea'
	| 'number'
	| 'color'
	| 'select'
	| 'segment'
	| 'padding'
	| 'slider'
	| 'socialLinks';

/**
 * Open union: any control name registered via the editor's `controls` prop is
 * valid. Unknown names fall back to a plain text input with a dev warning.
 */
export type InspectorControl = BuiltinInspectorControl | (string & {});

export interface SelectOption {
	label: string;
	value: string;
}

export interface InspectorField {
	/** Prop key this field edits. */
	key: string;
	label: string;
	control: InspectorControl;
	/** For 'select' / 'segment'. Plain strings mean label === value. */
	options?: (string | SelectOption)[];
	/** For 'number' / 'slider'. */
	min?: number;
	max?: number;
	step?: number;
	/** Display suffix for 'number' / 'slider' (e.g. 'px', '%'). */
	unit?: string;
	/** Map the stored prop value to the control value (e.g. '50%' → 50). */
	format?: (raw: unknown) => unknown;
	/** Map the control value back to the stored prop value (e.g. 50 → '50%'). */
	parse?: (value: unknown) => unknown;
	/** Custom control component for this field alone; takes precedence over `control`. */
	component?: Component<ControlProps>;
}

/** Contract every inspector control component implements. */
export interface ControlProps {
	field: InspectorField;
	value: unknown;
	setValue: (value: unknown) => void;
}

/** Control name → component, merged over the built-ins via the `controls` prop. */
export type ControlRegistry = Record<string, Component<ControlProps>>;

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
