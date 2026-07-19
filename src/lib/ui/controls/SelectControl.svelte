<script lang="ts">
	import * as select from '@zag-js/select';
	import { normalizeProps, portal, useMachine } from '@zag-js/svelte';
	import { normalizeOptions } from '../../core/registry/options.js';
	import type { SelectOption } from '../../core/registry/types.js';
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();

	const id = $props.id();

	const collection = $derived(
		select.collection({
			items: normalizeOptions(field.options),
			itemToString: (o: SelectOption) => o.label,
			itemToValue: (o: SelectOption) => o.value
		})
	);

	const service = useMachine(select.machine, () => ({
		id,
		collection,
		value: [(value as string) ?? ''],
		onValueChange(d: select.ValueChangeDetails) {
			if (d.value[0] !== value) setValue(d.value[0]);
		}
	}));

	const api = $derived(select.connect(service, normalizeProps));
</script>

<div {...api.getRootProps()}>
	<div {...api.getControlProps()}>
		<button {...api.getTriggerProps()} class="sme-select-trigger">
			<span {...api.getValueTextProps()}>{api.valueAsString || 'Select…'}</span>
			<span {...api.getIndicatorProps()}>▾</span>
		</button>
	</div>
	<div use:portal {...api.getPositionerProps()}>
		<div {...api.getContentProps()} class="sme-select-content">
			{#each collection.items as item (item.value)}
				<div {...api.getItemProps({ item })} class="sme-select-item">
					<span {...api.getItemTextProps({ item })}>{item.label}</span>
					<span {...api.getItemIndicatorProps({ item })}>✓</span>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.sme-select-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 6px;
		width: 100%;
		font: inherit;
		font-size: 13px;
		color: var(--sme-text, #0f172a);
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		padding: 5px 8px;
		cursor: pointer;
	}

	/* Popover content — portalled to <body>, so var() fallbacks matter. */
	.sme-select-content {
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
		padding: 4px;
		z-index: var(--sme-popover-z, 50);
		min-width: 140px;
	}

	.sme-select-content[hidden] {
		display: none;
	}

	.sme-select-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 13px;
		padding: 5px 8px;
		border-radius: 4px;
		cursor: pointer;
	}

	.sme-select-item[data-highlighted] {
		background: var(--sme-accent-soft, #dbeafe);
	}
</style>
