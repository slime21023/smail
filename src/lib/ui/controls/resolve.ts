import type { Component } from 'svelte';
import type { ControlProps, ControlRegistry, InspectorField } from '../../core/registry/types.js';
import { builtinControls } from './registry.js';
import TextControl from './TextControl.svelte';

/**
 * Resolution order: per-field `component` → editor-level `controls` registry →
 * built-ins → text-input fallback (with a warning).
 */
export function resolveControl(
	field: InspectorField,
	controls?: ControlRegistry
): Component<ControlProps> {
	if (field.component) return field.component;
	const named = controls?.[field.control] ?? builtinControls[field.control];
	if (named) return named;
	console.warn(`[smail] Unknown inspector control "${field.control}", falling back to text.`);
	return TextControl;
}
