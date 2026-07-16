<script lang="ts">
	import { dndzone } from 'svelte-dnd-action';
	import type { BlockRegistry } from '../core/registry/registry.js';

	interface Props {
		registry: BlockRegistry;
		onAdd: (type: string) => void;
	}

	let { registry, onAdd }: Props = $props();

	export interface PaletteItem {
		id: string;
		type: string;
		label: string;
		props: unknown;
	}

	function makeItems(): PaletteItem[] {
		return [...registry.values()].map((def) => ({
			id: `palette-${def.type}`,
			type: def.type,
			label: def.label,
			props: structuredClone(def.defaultProps)
		}));
	}

	let items = $state<PaletteItem[]>([]);
	$effect(() => {
		items = makeItems();
	});

	// Copy-on-drag: let the item follow the pointer during consider, then
	// restore the full palette on finalize — the canvas zone keeps the copy.
	function handleConsider(e: CustomEvent<{ items: PaletteItem[] }>) {
		items = e.detail.items;
	}

	function handleFinalize() {
		items = makeItems();
	}
</script>

<div class="sme-palette">
	<p class="sme-palette-heading">Blocks</p>
	<div
		class="sme-palette-items"
		use:dndzone={{
			items,
			type: 'block',
			flipDurationMs: 150,
			dropFromOthersDisabled: true,
			dropTargetStyle: {}
		}}
		onconsider={handleConsider}
		onfinalize={handleFinalize}
	>
		{#each items as item (item.id)}
			<button type="button" class="sme-palette-item" onclick={() => onAdd(item.type)}>
				{item.label}
			</button>
		{/each}
	</div>
	<p class="sme-palette-hint">Drag into a column, or click to add to the selected one.</p>
</div>

<style>
	.sme-palette {
		display: flex;
		flex-direction: column;
		padding: 12px;
	}

	.sme-palette-heading {
		margin: 0 0 10px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--sme-text-muted, #64748b);
	}

	.sme-palette-items {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.sme-palette-item {
		border: 1px solid var(--sme-border, #e2e8f0);
		background: var(--sme-panel-bg, #ffffff);
		color: var(--sme-text, #0f172a);
		border-radius: var(--sme-radius, 6px);
		padding: 8px 10px;
		font: inherit;
		font-size: 13px;
		text-align: left;
		cursor: grab;
	}

	.sme-palette-item:hover {
		border-color: var(--sme-accent, #2563eb);
		background: var(--sme-accent-soft, #dbeafe);
	}

	.sme-palette-hint {
		margin: 10px 0 0;
		font-size: 11px;
		color: var(--sme-text-muted, #64748b);
	}
</style>
