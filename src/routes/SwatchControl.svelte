<script lang="ts">
	import type { ControlProps } from '$lib/index.js';

	// Demo custom inspector control: a fixed brand-color swatch row.
	let { field, value, setValue }: ControlProps = $props();

	const brandColors = ['#dc2626', '#2563eb', '#16a34a', '#9333ea', '#0f172a'];
</script>

<div class="swatch-row" role="radiogroup" aria-label={field.label}>
	{#each brandColors as color (color)}
		<button
			type="button"
			role="radio"
			aria-checked={value === color}
			aria-label={color}
			class="swatch"
			class:active={value === color}
			style:background={color}
			onclick={() => setValue(color)}
		></button>
	{/each}
</div>

<style>
	.swatch-row {
		display: flex;
		gap: 6px;
	}

	.swatch {
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		padding: 0;
	}

	.swatch.active {
		border-color: var(--sme-accent, #2563eb);
		outline: 2px solid var(--sme-accent-soft, #dbeafe);
	}
</style>
