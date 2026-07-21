import type { Component } from 'svelte';
import type { ParamDelimiters } from '../params/params.js';
import type { ParameterDef } from '../schema/types.js';

/** Built-in control kinds the Inspector ships with. */
export type BuiltinInspectorControl =
	| 'text'
	| 'textarea'
	| 'number'
	| 'color'
	| 'select'
	| 'segment'
	| 'padding'
	| 'slider'
	| 'socialLinks'
	| 'imageSrc';

/**
 * Open union: any control name registered via the editor's `controls` prop is
 * valid. Unknown names fall back to a plain text input with a dev warning.
 */
export type InspectorControl = BuiltinInspectorControl | (string & {});

/** Display/value pair for select-like Inspector controls. */
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

/** Contract every Inspector control component implements. `setValue` writes the owning editable state. */
export interface ControlProps {
	field: InspectorField;
	value: unknown;
	setValue: (value: unknown) => void;
}

/**
 * Contract for an optional Inspector-only rich text editor. `setValue` is
 * sanitized before persistence; `createParameter` returns null for invalid keys.
 */
export interface TextEditorProps {
	value: string;
	setValue: (html: string) => void;
	disabled: boolean;
	parameters: ParameterDef[];
	delimiters: ParamDelimiters;
	createParameter: (key: string, label?: string) => ParameterDef | null;
}

/** Control name → component, merged over the built-ins via the `controls` prop. */
export type ControlRegistry = Record<string, Component<ControlProps>>;

/**
 * A registered block type. `toMjml` is trusted host code: escape user input and
 * validate URLs before emitting MJML, because smail cannot sanitize custom output.
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

/** Type-preserving helper for declaring a custom block definition. */
export function defineBlock<P>(definition: BlockDefinition<P>): BlockDefinition<P> {
	return definition;
}
