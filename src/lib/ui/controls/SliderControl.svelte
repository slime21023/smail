<script lang="ts">
	import * as slider from '@zag-js/slider';
	import { normalizeProps, useMachine } from '@zag-js/svelte';
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();

	const id = $props.id();

	const service = useMachine(slider.machine, () => ({
		id,
		value: [Number(value ?? field.min ?? 0)],
		min: field.min,
		max: field.max,
		step: field.step ?? 1,
		onValueChange(d: slider.ValueChangeDetails) {
			if (d.value[0] !== value) setValue(d.value[0]);
		}
	}));

	const api = $derived(slider.connect(service, normalizeProps));
</script>

<div {...api.getRootProps()} class="sme-slider">
	<div {...api.getControlProps()} class="sme-slider-control">
		<div {...api.getTrackProps()} class="sme-slider-track">
			<div {...api.getRangeProps()} class="sme-slider-range"></div>
		</div>
		<div {...api.getThumbProps({ index: 0 })} class="sme-slider-thumb">
			<input {...api.getHiddenInputProps({ index: 0 })} aria-label={field.label} />
		</div>
	</div>
	<span {...api.getValueTextProps()} class="sme-slider-value">
		{api.value[0]}{field.unit ?? ''}
	</span>
</div>

<style>
	.sme-slider {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.sme-slider-control {
		position: relative;
		flex: 1;
		display: flex;
		align-items: center;
		height: 20px;
	}

	.sme-slider-track {
		width: 100%;
		height: 4px;
		border-radius: 2px;
		background: var(--sme-border, #e2e8f0);
	}

	.sme-slider-range {
		height: 100%;
		border-radius: 2px;
		background: var(--sme-accent, #2563eb);
	}

	.sme-slider-thumb {
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--sme-panel-bg, #ffffff);
		border: 2px solid var(--sme-accent, #2563eb);
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.2);
		cursor: grab;
	}

	.sme-slider-thumb:focus-visible {
		outline: 2px solid var(--sme-accent-soft, #dbeafe);
	}

	.sme-slider-value {
		min-width: 42px;
		text-align: right;
		font-size: 12px;
		color: var(--sme-text-muted, #64748b);
		font-variant-numeric: tabular-nums;
	}
</style>
