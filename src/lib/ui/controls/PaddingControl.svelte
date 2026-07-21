<script lang="ts">
	import * as numberInput from '@zag-js/number-input';
	import { normalizeProps, useMachine } from '@zag-js/svelte';
	import type { Padding } from '../../core/schema/types.js';
	import type { ControlProps } from './types.js';
	import { getWheelAdjustedValue } from './wheel.js';

	let { field, value, setValue }: ControlProps = $props();

	const sides = ['top', 'right', 'bottom', 'left'] as const;

	const id = $props.id();

	function pad(): Padding {
		return (value as Padding) ?? { top: 0, right: 0, bottom: 0, left: 0 };
	}

	// Locked = editing any side writes all four. Starts locked when uniform.
	const initial = pad();
	let locked = $state(
		initial.top === initial.right &&
			initial.top === initial.bottom &&
			initial.top === initial.left
	);

	function setSide(side: (typeof sides)[number], next: number) {
		if (locked) {
			setValue({ top: next, right: next, bottom: next, left: next });
		} else {
			setValue({ ...pad(), [side]: next });
		}
	}

	function handleWheel(side: (typeof sides)[number], event: WheelEvent) {
		const current = pad()[side] ?? 0;
		const next = getWheelAdjustedValue(current, event.deltaY, { min: 0 });
		if (next === current) return;
		event.preventDefault();
		setSide(side, next);
	}

	const services = sides.map((side) =>
		useMachine(numberInput.machine, () => ({
			id: `${id}-${side}`,
			value: String(pad()[side] ?? 0),
			min: 0,
			onValueChange(d: numberInput.ValueChangeDetails) {
				if (!Number.isNaN(d.valueAsNumber) && d.valueAsNumber !== pad()[side]) {
					setSide(side, d.valueAsNumber);
				}
			}
		}))
	);

	const apis = $derived(services.map((s) => numberInput.connect(s, normalizeProps)));
</script>

<div class="sme-padding-control">
	<div class="sme-padding-grid">
		{#each sides as side, i (side)}
			<div class="sme-padding-side">
				<span>{side[0].toUpperCase()}</span>
				<input
					{...apis[i].getInputProps()}
					aria-label="{field.label} {side}"
					onwheel={(event) => handleWheel(side, event)}
				/>
			</div>
		{/each}
	</div>
	<button
		type="button"
		class="sme-padding-lock"
		class:locked
		aria-pressed={locked}
		aria-label="Link all sides"
		title={locked ? 'Sides linked — edit one to set all' : 'Link all sides'}
		onclick={() => (locked = !locked)}
	>
		🔗
	</button>
</div>

<style>
	.sme-padding-control {
		display: flex;
		align-items: flex-end;
		gap: 4px;
	}

	.sme-padding-grid {
		flex: 1;
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

	.sme-padding-lock {
		border: 1px solid var(--sme-border, #e2e8f0);
		background: var(--sme-panel-bg, #ffffff);
		border-radius: var(--sme-radius, 6px);
		padding: 4px 6px;
		font-size: 11px;
		line-height: 1.4;
		cursor: pointer;
		opacity: 0.45;
	}

	.sme-padding-lock.locked {
		opacity: 1;
	}

	.sme-padding-lock.locked {
		border-color: var(--sme-accent, #2563eb);
		background: var(--sme-accent-soft, #dbeafe);
	}
</style>
