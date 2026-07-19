<script lang="ts">
	import * as numberInput from '@zag-js/number-input';
	import { normalizeProps, useMachine } from '@zag-js/svelte';
	import type { Padding } from '../../core/schema/types.js';
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();

	const sides = ['top', 'right', 'bottom', 'left'] as const;

	const id = $props.id();

	function pad(): Padding {
		return (value as Padding) ?? { top: 0, right: 0, bottom: 0, left: 0 };
	}

	const services = sides.map((side) =>
		useMachine(numberInput.machine, () => ({
			id: `${id}-${side}`,
			value: String(pad()[side] ?? 0),
			min: 0,
			onValueChange(d: numberInput.ValueChangeDetails) {
				if (!Number.isNaN(d.valueAsNumber) && d.valueAsNumber !== pad()[side]) {
					setValue({ ...pad(), [side]: d.valueAsNumber });
				}
			}
		}))
	);

	const apis = $derived(services.map((s) => numberInput.connect(s, normalizeProps)));
</script>

<div class="sme-padding-grid">
	{#each sides as side, i (side)}
		<div class="sme-padding-side">
			<span>{side[0].toUpperCase()}</span>
			<input {...apis[i].getInputProps()} aria-label="{field.label} {side}" />
		</div>
	{/each}
</div>

<style>
	.sme-padding-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}

	.sme-padding-side {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 10px;
		color: var(--sme-text-muted, #64748b);
		text-align: center;
	}
</style>
