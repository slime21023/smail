<script lang="ts">
	import { MIN_COLUMN_WIDTH, resolveColumnWidths } from '../core/schema/tree.js';
	import type { Column, Section } from '../core/schema/types.js';

	interface Props {
		section: Section;
		column: Column;
		onSetWidth: (columnId: string, percent: number) => void;
	}

	let { section, column, onSetWidth }: Props = $props();
	let index = $derived(section.columns.indexOf(column));
	let value = $derived(resolveColumnWidths(section.columns)[index] ?? 100);
	let max = $derived(100 - (section.columns.length - 1) * MIN_COLUMN_WIDTH);
</script>

<label class="sme-column-width">
	<span>Width: {value}%</span>
	<input
		type="range"
		min={MIN_COLUMN_WIDTH}
		max={max}
		step="5"
		value={value}
		oninput={(event) => onSetWidth(column.id, Number(event.currentTarget.value))}
	/>
	<small>Other columns adjust proportionally.</small>
</label>

<style>
	.sme-column-width { display: flex; flex-direction: column; gap: 4px; }
	.sme-column-width span { font-size: 11px; font-weight: 600; color: var(--sme-text-muted, #64748b); }
	.sme-column-width input { width: 100%; accent-color: var(--sme-accent, #2563eb); }
	.sme-column-width small { font-size: 11px; color: var(--sme-text-muted, #64748b); }
</style>
