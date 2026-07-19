<script lang="ts">
	import * as numberInput from '@zag-js/number-input';
	import { normalizeProps, useMachine } from '@zag-js/svelte';
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();

	const id = $props.id();

	const service = useMachine(numberInput.machine, () => ({
		id,
		value: String((value as number) ?? 0),
		min: field.min,
		max: field.max,
		step: field.step ?? 1,
		onValueChange(d: numberInput.ValueChangeDetails) {
			if (!Number.isNaN(d.valueAsNumber) && d.valueAsNumber !== value) setValue(d.valueAsNumber);
		}
	}));

	const api = $derived(numberInput.connect(service, normalizeProps));
</script>

<div {...api.getRootProps()}>
	<div {...api.getControlProps()} class="sme-number-control">
		<input {...api.getInputProps()} aria-label={field.label} />
		<div class="sme-number-triggers">
			<button {...api.getIncrementTriggerProps()}>▲</button>
			<button {...api.getDecrementTriggerProps()}>▼</button>
		</div>
	</div>
</div>

<style>
	.sme-number-control {
		display: flex;
		align-items: stretch;
		gap: 2px;
	}

	.sme-number-triggers {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.sme-number-triggers button {
		flex: 1;
		border: 1px solid var(--sme-border, #e2e8f0);
		background: var(--sme-bg, #f1f5f9);
		border-radius: 3px;
		font-size: 7px;
		line-height: 1;
		padding: 0 5px;
		cursor: pointer;
		color: var(--sme-text-muted, #64748b);
	}

	.sme-number-triggers button:hover {
		background: var(--sme-accent-soft, #dbeafe);
	}
</style>
