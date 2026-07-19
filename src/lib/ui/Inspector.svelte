<script lang="ts">
	import type { BlockRegistry } from '../core/registry/registry.js';
	import {
		columnFields,
		sectionFields,
		settingsFields,
		type StructuralFields
	} from '../core/registry/structural.js';
	import type { ControlRegistry } from '../core/registry/types.js';
	import type { NodeRef } from '../core/schema/tree.js';
	import type { DocumentSettings } from '../core/schema/types.js';
	import FieldControl from './FieldControl.svelte';

	interface Props {
		node: NodeRef | null;
		settings: DocumentSettings;
		registry: BlockRegistry;
		onDelete: (id: string) => void;
		controls?: ControlRegistry;
		structural?: StructuralFields;
	}

	let { node, settings, registry, onDelete, controls, structural = {} }: Props = $props();

	let heading = $derived(
		node === null
			? 'Document'
			: node.kind === 'block'
				? (registry.get(node.block.type)?.label ?? node.block.type)
				: node.kind === 'section'
					? 'Section'
					: 'Column'
	);

	let fields = $derived(
		node === null
			? (structural.settings ?? settingsFields)
			: node.kind === 'section'
				? (structural.section ?? sectionFields)
				: node.kind === 'column'
					? (structural.column ?? columnFields)
					: (registry.get(node.block.type)?.inspector ?? [])
	);

	let target = $derived(
		(node === null
			? settings
			: node.kind === 'section'
				? node.section.props
				: node.kind === 'column'
					? node.column.props
					: node.block.props) as unknown as Record<string, unknown>
	);

	let deletableId = $derived(
		node === null
			? null
			: node.kind === 'section'
				? node.section.id
				: node.kind === 'column'
					? node.column.id
					: node.block.id
	);
</script>

<div class="sme-inspector">
	<p class="sme-inspector-heading">{heading}</p>

	{#each fields as field (field.key)}
		<FieldControl {field} {target} {controls} />
	{/each}

	{#if deletableId !== null}
		<button type="button" class="sme-delete" onclick={() => onDelete(deletableId)}>
			Delete {node?.kind}
		</button>
	{/if}
</div>

<style>
	.sme-inspector {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 12px;
	}

	.sme-inspector-heading {
		margin: 0 0 4px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--sme-text-muted, #64748b);
	}

	.sme-delete {
		margin-top: 8px;
		border: 1px solid #fecaca;
		background: #fef2f2;
		color: #b91c1c;
		border-radius: var(--sme-radius, 6px);
		padding: 6px 10px;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.sme-delete:hover {
		background: #fee2e2;
	}
</style>
