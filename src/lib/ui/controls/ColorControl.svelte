<script lang="ts">
	import * as colorPicker from '@zag-js/color-picker';
	import { parseColor } from '@zag-js/color-utils';
	import { normalizeProps, portal, useMachine } from '@zag-js/svelte';
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();

	const id = $props.id();

	function toColor(raw: unknown) {
		try {
			return parseColor(typeof raw === 'string' && raw ? raw : '#000000');
		} catch {
			return parseColor('#000000');
		}
	}

	const service = useMachine(colorPicker.machine, () => ({
		id,
		value: toColor(value),
		onValueChange(d: colorPicker.ValueChangeDetails) {
			const hex = d.value.toString('hex');
			if (hex !== value) setValue(hex);
		}
	}));

	const api = $derived(colorPicker.connect(service, normalizeProps));
</script>

<div {...api.getRootProps()}>
	<div {...api.getControlProps()} class="sme-color-control">
		<button {...api.getTriggerProps()} class="sme-color-trigger">
			<span {...api.getSwatchProps({ value: api.value })} class="sme-color-swatch"></span>
		</button>
		<input {...api.getChannelInputProps({ channel: 'hex' })} aria-label={field.label} />
	</div>
	<div use:portal {...api.getPositionerProps()}>
		<div {...api.getContentProps()} class="sme-cp-content">
			<div {...api.getAreaProps()} class="sme-cp-area">
				<div {...api.getAreaBackgroundProps()} class="sme-cp-area-bg"></div>
				<div {...api.getAreaThumbProps()} class="sme-cp-thumb"></div>
			</div>
			<div {...api.getChannelSliderProps({ channel: 'hue' })} class="sme-cp-slider">
				<div {...api.getChannelSliderTrackProps({ channel: 'hue' })} class="sme-cp-slider-track"></div>
				<div {...api.getChannelSliderThumbProps({ channel: 'hue' })} class="sme-cp-thumb"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.sme-color-control {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.sme-color-trigger {
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		background: var(--sme-panel-bg, #ffffff);
		padding: 3px;
		cursor: pointer;
		line-height: 0;
	}

	.sme-color-swatch {
		display: block;
		width: 20px;
		height: 20px;
		border-radius: 3px;
	}

	/* Popover content — portalled to <body>, so var() fallbacks matter. */
	.sme-cp-content {
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
		padding: 10px;
		z-index: var(--sme-popover-z, 50);
	}

	.sme-cp-content[hidden] {
		display: none;
	}

	.sme-cp-area {
		position: relative;
		width: 180px;
		height: 120px;
		border-radius: 4px;
		overflow: hidden;
	}

	.sme-cp-area-bg {
		width: 100%;
		height: 100%;
	}

	.sme-cp-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid #ffffff;
		box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.3);
		transform: translate(-50%, -50%);
	}

	.sme-cp-slider {
		position: relative;
		height: 12px;
	}

	.sme-cp-slider-track {
		height: 100%;
		border-radius: 6px;
	}
</style>
