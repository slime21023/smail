import type { Component } from 'svelte';
import type { InspectorField } from '../../core/registry/types.js';

/** Contract every inspector control component implements. */
export interface ControlProps {
	field: InspectorField;
	value: unknown;
	setValue: (value: unknown) => void;
}

export type ControlComponent = Component<ControlProps>;

/** Control name → component. */
export type ControlRegistry = Record<string, ControlComponent>;
