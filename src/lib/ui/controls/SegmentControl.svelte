<script lang="ts">
	import * as radioGroup from '@zag-js/radio-group';
	import { normalizeProps, useMachine } from '@zag-js/svelte';
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();

	const id = $props.id();

	const service = useMachine(radioGroup.machine, () => ({
		id,
		value: (value as string) ?? null,
		onValueChange(d: radioGroup.ValueChangeDetails) {
			if (d.value !== value) setValue(d.value);
		}
	}));

	const api = $derived(radioGroup.connect(service, normalizeProps));
</script>

<div {...api.getRootProps()} class="sme-segment-root">
	<div {...api.getIndicatorProps()} class="sme-segment-indicator"></div>
	{#each field.options ?? [] as option (option)}
		<label {...api.getItemProps({ value: option })} class="sme-segment-item">
			<span {...api.getItemTextProps({ value: option })}>{option}</span>
			<span {...api.getItemControlProps({ value: option })}></span>
			<input {...api.getItemHiddenInputProps({ value: option })} />
		</label>
	{/each}
</div>

<style>
	.sme-segment-root {
		position: relative;
		display: flex;
		gap: 2px;
		background: var(--sme-bg, #f1f5f9);
		border-radius: var(--sme-radius, 6px);
		padding: 2px;
	}

	.sme-segment-item {
		flex: 1;
		position: relative;
		z-index: 1;
		text-align: center;
		font-size: 12px;
		padding: 4px 6px;
		cursor: pointer;
		border-radius: calc(var(--sme-radius, 6px) - 2px);
		user-select: none;
	}

	.sme-segment-indicator {
		position: absolute;
		z-index: 0;
		width: var(--width);
		height: var(--height);
		top: var(--top);
		left: var(--left);
		background: var(--sme-panel-bg, #ffffff);
		border-radius: calc(var(--sme-radius, 6px) - 2px);
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
	}
</style>
