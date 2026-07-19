<script lang="ts">
	import type { InspectorField } from '../core/registry/types.js';
	import { builtinControls } from './controls/registry.js';
	import TextControl from './controls/TextControl.svelte';

	interface Props {
		field: InspectorField;
		/** The (reactive) props object of the selected block. Mutated in place. */
		target: Record<string, unknown>;
	}

	let { field, target }: Props = $props();

	const Control = $derived.by(() => {
		const control = builtinControls[field.control];
		if (!control) {
			console.warn(`[smail] Unknown inspector control "${field.control}", falling back to text.`);
			return TextControl;
		}
		return control;
	});
</script>

<div class="sme-field">
	<span class="sme-field-label">{field.label}</span>
	<Control {field} value={target[field.key]} setValue={(v) => (target[field.key] = v)} />
</div>

<style>
	.sme-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.sme-field-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--sme-text-muted, #64748b);
	}

	/* Shared input look for every control (controls render in child components). */
	.sme-field :global(input:not([type='radio'])),
	.sme-field :global(textarea) {
		font: inherit;
		font-size: 13px;
		color: var(--sme-text, #0f172a);
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		padding: 5px 8px;
		box-sizing: border-box;
		width: 100%;
		min-width: 0;
	}

	.sme-field :global(input:not([type='radio']):focus-visible),
	.sme-field :global(textarea:focus-visible) {
		outline: 2px solid var(--sme-accent, #2563eb);
		outline-offset: -1px;
	}
</style>
