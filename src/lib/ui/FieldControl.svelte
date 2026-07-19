<script lang="ts">
	import type { ControlRegistry, InspectorField } from '../core/registry/types.js';
	import { resolveControl } from './controls/resolve.js';

	interface Props {
		field: InspectorField;
		/** The (reactive) props object of the selected node. Mutated in place. */
		target: Record<string, unknown>;
		/** Editor-level custom controls (merged over built-ins by name). */
		controls?: ControlRegistry;
	}

	let { field, target, controls }: Props = $props();

	const Control = $derived(resolveControl(field, controls));

	function read(): unknown {
		const raw = target[field.key];
		return field.format ? field.format(raw) : raw;
	}

	function write(value: unknown) {
		target[field.key] = field.parse ? field.parse(value) : value;
	}
</script>

<div class="sme-field">
	<span class="sme-field-label">{field.label}</span>
	<Control {field} value={read()} setValue={write} />
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
