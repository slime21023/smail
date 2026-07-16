<script lang="ts">
	import type { BlockRegistry } from '../core/registry/registry.js';

	interface Props {
		registry: BlockRegistry;
		onAdd: (type: string) => void;
	}

	let { registry, onAdd }: Props = $props();
</script>

<div class="sme-palette">
	<p class="sme-palette-heading">Blocks</p>
	{#each [...registry.values()] as def (def.type)}
		<button type="button" class="sme-palette-item" onclick={() => onAdd(def.type)}>
			{def.label}
		</button>
	{/each}
	<p class="sme-palette-hint">Click to add to the selected column. Drag &amp; drop lands in M3.</p>
</div>

<style>
	.sme-palette {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px;
	}

	.sme-palette-heading {
		margin: 0 0 4px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--sme-text-muted, #64748b);
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
		cursor: pointer;
	}

	.sme-palette-item:hover {
		border-color: var(--sme-accent, #2563eb);
		background: var(--sme-accent-soft, #dbeafe);
	}

	.sme-palette-hint {
		margin: 8px 0 0;
		font-size: 11px;
		color: var(--sme-text-muted, #64748b);
	}
</style>
