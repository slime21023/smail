<script lang="ts">
	import {
		ColorPicker,
		parseColor,
		type ColorPickerValueChangeDetails as ColorChange
	} from '@ark-ui/svelte/color-picker';
	import { createListCollection } from '@ark-ui/svelte/collection';
	import {
		NumberInput,
		type NumberInputValueChangeDetails as NumberChange
	} from '@ark-ui/svelte/number-input';
	import { Portal } from '@ark-ui/svelte/portal';
	import {
		SegmentGroup,
		type SegmentGroupValueChangeDetails as SegmentChange
	} from '@ark-ui/svelte/segment-group';
	import { Select, type SelectValueChangeDetails as SelectChange } from '@ark-ui/svelte/select';
	import type { InspectorField } from '../core/registry/types.js';
	import type { Padding } from '../core/schema/types.js';

	interface Props {
		field: InspectorField;
		/** The (reactive) props object of the selected block. Mutated in place. */
		target: Record<string, unknown>;
	}

	let { field, target }: Props = $props();

	const paddingSides = ['top', 'right', 'bottom', 'left'] as const;

	let selectCollection = $derived(createListCollection({ items: field.options ?? [] }));

	function setNumber(value: number) {
		if (!Number.isNaN(value)) target[field.key] = value;
	}

	function padding(): Padding {
		return target[field.key] as Padding;
	}

	function currentColor() {
		const raw = target[field.key];
		try {
			return parseColor(typeof raw === 'string' && raw ? raw : '#000000');
		} catch {
			return parseColor('#000000');
		}
	}
</script>

<div class="sme-field">
	<span class="sme-field-label">{field.label}</span>

	{#if field.control === 'text'}
		<input
			type="text"
			aria-label={field.label}
			value={(target[field.key] as string) ?? ''}
			oninput={(e) => (target[field.key] = e.currentTarget.value)}
		/>
	{:else if field.control === 'textarea'}
		<textarea
			rows="4"
			aria-label={field.label}
			value={(target[field.key] as string) ?? ''}
			oninput={(e) => (target[field.key] = e.currentTarget.value)}
		></textarea>
	{:else if field.control === 'number'}
		<NumberInput.Root
			value={String((target[field.key] as number) ?? 0)}
			min={field.min}
			max={field.max}
			step={field.step ?? 1}
			onValueChange={(d: NumberChange) => setNumber(d.valueAsNumber)}
		>
			<NumberInput.Control>
				<NumberInput.Input aria-label={field.label} />
				<div class="sme-number-triggers">
					<NumberInput.IncrementTrigger>▲</NumberInput.IncrementTrigger>
					<NumberInput.DecrementTrigger>▼</NumberInput.DecrementTrigger>
				</div>
			</NumberInput.Control>
		</NumberInput.Root>
	{:else if field.control === 'color'}
		<ColorPicker.Root
			value={currentColor()}
			onValueChange={(d: ColorChange) => (target[field.key] = d.value.toString('hex'))}
		>
			<ColorPicker.Control>
				<ColorPicker.Trigger>
					<ColorPicker.ValueSwatch />
				</ColorPicker.Trigger>
				<ColorPicker.ChannelInput channel="hex" aria-label={field.label} />
			</ColorPicker.Control>
			<Portal>
				<ColorPicker.Positioner>
					<ColorPicker.Content class="sme-cp-content">
						<ColorPicker.Area>
							<ColorPicker.AreaBackground />
							<ColorPicker.AreaThumb />
						</ColorPicker.Area>
						<ColorPicker.ChannelSlider channel="hue">
							<ColorPicker.ChannelSliderTrack />
							<ColorPicker.ChannelSliderThumb />
						</ColorPicker.ChannelSlider>
					</ColorPicker.Content>
				</ColorPicker.Positioner>
			</Portal>
		</ColorPicker.Root>
	{:else if field.control === 'select'}
		<Select.Root
			collection={selectCollection}
			value={[(target[field.key] as string) ?? '']}
			onValueChange={(d: SelectChange) => (target[field.key] = d.value[0])}
		>
			<Select.Control>
				<Select.Trigger>
					<Select.ValueText placeholder="Select…" />
					<Select.Indicator>▾</Select.Indicator>
				</Select.Trigger>
			</Select.Control>
			<Portal>
				<Select.Positioner>
					<Select.Content class="sme-select-content">
						{#each selectCollection.items as item (item)}
							<Select.Item {item}>
								<Select.ItemText>{item}</Select.ItemText>
								<Select.ItemIndicator>✓</Select.ItemIndicator>
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Positioner>
			</Portal>
		</Select.Root>
	{:else if field.control === 'segment'}
		<SegmentGroup.Root
			value={(target[field.key] as string) ?? null}
			onValueChange={(d: SegmentChange) => (target[field.key] = d.value)}
		>
			<SegmentGroup.Indicator />
			{#each field.options ?? [] as option (option)}
				<SegmentGroup.Item value={option}>
					<SegmentGroup.ItemText>{option}</SegmentGroup.ItemText>
					<SegmentGroup.ItemControl />
					<SegmentGroup.ItemHiddenInput />
				</SegmentGroup.Item>
			{/each}
		</SegmentGroup.Root>
	{:else if field.control === 'padding'}
		<div class="sme-padding-grid">
			{#each paddingSides as side (side)}
				<div class="sme-padding-side">
					<span>{side[0].toUpperCase()}</span>
					<NumberInput.Root
						value={String(padding()[side])}
						min={0}
						onValueChange={(d: NumberChange) => {
							if (!Number.isNaN(d.valueAsNumber)) padding()[side] = d.valueAsNumber;
						}}
					>
						<NumberInput.Input aria-label="{field.label} {side}" />
					</NumberInput.Root>
				</div>
			{/each}
		</div>
	{/if}
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

	/* Shared input look — native inputs here, Ark parts via :global. */
	input,
	textarea,
	.sme-field :global(input[data-scope]) {
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

	textarea {
		resize: vertical;
	}

	input:focus-visible,
	textarea:focus-visible,
	.sme-field :global(input[data-scope]:focus-visible) {
		outline: 2px solid var(--sme-accent, #2563eb);
		outline-offset: -1px;
	}

	/* NumberInput */
	.sme-field :global([data-scope='number-input'][data-part='control']) {
		display: flex;
		align-items: stretch;
		gap: 2px;
	}

	.sme-number-triggers {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.sme-number-triggers :global(button) {
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

	.sme-number-triggers :global(button:hover) {
		background: var(--sme-accent-soft, #dbeafe);
	}

	/* ColorPicker control */
	.sme-field :global([data-scope='color-picker'][data-part='control']) {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.sme-field :global([data-scope='color-picker'][data-part='trigger']) {
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		background: var(--sme-panel-bg, #ffffff);
		padding: 3px;
		cursor: pointer;
		line-height: 0;
	}

	.sme-field :global([data-scope='color-picker'] [data-part='value-swatch']) {
		display: block;
		width: 20px;
		height: 20px;
		border-radius: 3px;
	}

	/* Select */
	.sme-field :global([data-scope='select'][data-part='trigger']) {
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

	/* SegmentGroup */
	.sme-field :global([data-scope='segment-group'][data-part='root']) {
		position: relative;
		display: flex;
		gap: 2px;
		background: var(--sme-bg, #f1f5f9);
		border-radius: var(--sme-radius, 6px);
		padding: 2px;
	}

	.sme-field :global([data-scope='segment-group'][data-part='item']) {
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

	.sme-field :global([data-scope='segment-group'][data-part='indicator']) {
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

	/* Padding grid */
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

	/* Portalled popovers (global — they render under <body>) */
	:global(.sme-cp-content) {
		display: flex;
		flex-direction: column;
		gap: 8px;
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
		padding: 10px;
		z-index: 50;
	}

	:global(.sme-cp-content [data-part='area']) {
		position: relative;
		width: 180px;
		height: 120px;
		border-radius: 4px;
		overflow: hidden;
	}

	:global(.sme-cp-content [data-part='area-background']) {
		width: 100%;
		height: 100%;
	}

	:global(.sme-cp-content [data-part='area-thumb']),
	:global(.sme-cp-content [data-part='channel-slider-thumb']) {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid #ffffff;
		box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.3);
		transform: translate(-50%, -50%);
	}

	:global(.sme-cp-content [data-part='channel-slider']) {
		position: relative;
		height: 12px;
	}

	:global(.sme-cp-content [data-part='channel-slider-track']) {
		height: 100%;
		border-radius: 6px;
	}

	:global(.sme-select-content) {
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		box-shadow: 0 8px 24px rgba(15, 23, 42, 0.16);
		padding: 4px;
		z-index: 50;
		min-width: 140px;
	}

	:global(.sme-select-content [data-part='item']) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 13px;
		padding: 5px 8px;
		border-radius: 4px;
		cursor: pointer;
	}

	:global(.sme-select-content [data-part='item'][data-highlighted]) {
		background: var(--sme-accent-soft, #dbeafe);
	}
</style>
