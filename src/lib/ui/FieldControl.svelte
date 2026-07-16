<script lang="ts">
	import type { InspectorField } from '../core/registry/types.js';
	import type { Padding } from '../core/schema/types.js';

	interface Props {
		field: InspectorField;
		/** The (reactive) props object of the selected block. Mutated in place. */
		target: Record<string, unknown>;
	}

	let { field, target }: Props = $props();

	const paddingSides = ['top', 'right', 'bottom', 'left'] as const;

	function setNumber(value: number) {
		if (!Number.isNaN(value)) target[field.key] = value;
	}

	function padding(): Padding {
		return target[field.key] as Padding;
	}
</script>

<label class="sme-field">
	<span class="sme-field-label">{field.label}</span>

	{#if field.control === 'text'}
		<input
			type="text"
			value={(target[field.key] as string) ?? ''}
			oninput={(e) => (target[field.key] = e.currentTarget.value)}
		/>
	{:else if field.control === 'textarea'}
		<textarea
			rows="4"
			value={(target[field.key] as string) ?? ''}
			oninput={(e) => (target[field.key] = e.currentTarget.value)}
		></textarea>
	{:else if field.control === 'number'}
		<input
			type="number"
			min={field.min}
			max={field.max}
			step={field.step ?? 1}
			value={(target[field.key] as number) ?? 0}
			oninput={(e) => setNumber(e.currentTarget.valueAsNumber)}
		/>
	{:else if field.control === 'color'}
		<input
			type="color"
			value={(target[field.key] as string) ?? '#333333'}
			oninput={(e) => (target[field.key] = e.currentTarget.value)}
		/>
	{:else if field.control === 'select'}
		<select
			value={(target[field.key] as string) ?? ''}
			onchange={(e) => (target[field.key] = e.currentTarget.value)}
		>
			{#each field.options ?? [] as option (option)}
				<option value={option}>{option}</option>
			{/each}
		</select>
	{:else if field.control === 'segment'}
		<div class="sme-segment" role="group" aria-label={field.label}>
			{#each field.options ?? [] as option (option)}
				<button
					type="button"
					class:sme-segment-active={target[field.key] === option}
					onclick={() => (target[field.key] = option)}
				>
					{option}
				</button>
			{/each}
		</div>
	{:else if field.control === 'padding'}
		<div class="sme-padding-grid">
			{#each paddingSides as side (side)}
				<label class="sme-padding-side">
					<span>{side[0].toUpperCase()}</span>
					<input
						type="number"
						min="0"
						value={padding()[side]}
						oninput={(e) => {
							const v = e.currentTarget.valueAsNumber;
							if (!Number.isNaN(v)) padding()[side] = v;
						}}
					/>
				</label>
			{/each}
		</div>
	{/if}
</label>

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

	input,
	textarea,
	select {
		font: inherit;
		font-size: 13px;
		color: var(--sme-text, #0f172a);
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		padding: 5px 8px;
		box-sizing: border-box;
		width: 100%;
	}

	input[type='color'] {
		padding: 2px;
		height: 30px;
	}

	textarea {
		resize: vertical;
	}

	.sme-segment {
		display: flex;
		gap: 2px;
		background: var(--sme-bg, #f1f5f9);
		border-radius: var(--sme-radius, 6px);
		padding: 2px;
	}

	.sme-segment button {
		flex: 1;
		border: none;
		background: transparent;
		border-radius: calc(var(--sme-radius, 6px) - 2px);
		padding: 4px 6px;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
		color: var(--sme-text, #0f172a);
	}

	.sme-segment button.sme-segment-active {
		background: var(--sme-panel-bg, #ffffff);
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
	}

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
