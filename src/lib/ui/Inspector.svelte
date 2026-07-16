<script lang="ts">
	import type { BlockRegistry } from '../core/registry/registry.js';
	import type { NodeRef } from '../core/schema/tree.js';
	import type { DocumentSettings } from '../core/schema/types.js';
	import FieldControl from './FieldControl.svelte';
	import type { InspectorField } from '../core/registry/types.js';

	interface Props {
		node: NodeRef | null;
		settings: DocumentSettings;
		registry: BlockRegistry;
		onDelete: (id: string) => void;
	}

	let { node, settings, registry, onDelete }: Props = $props();

	const sectionFields: InspectorField[] = [
		{ key: 'padding', label: 'Padding', control: 'padding' },
		{ key: 'backgroundColor', label: 'Background', control: 'color' },
		{ key: 'backgroundUrl', label: 'Background image URL', control: 'text' }
	];

	const columnFields: InspectorField[] = [
		{ key: 'width', label: 'Width (e.g. 50%)', control: 'text' },
		{ key: 'verticalAlign', label: 'Vertical align', control: 'segment', options: ['top', 'middle', 'bottom'] },
		{ key: 'backgroundColor', label: 'Background', control: 'color' }
	];

	const settingsFields: InspectorField[] = [
		{ key: 'width', label: 'Email width (px)', control: 'number', min: 320, max: 800 },
		{ key: 'backgroundColor', label: 'Background', control: 'color' },
		{ key: 'fontFamily', label: 'Font family', control: 'text' },
		{ key: 'textColor', label: 'Text color', control: 'color' },
		{ key: 'linkColor', label: 'Link color', control: 'color' },
		{ key: 'preheader', label: 'Preheader text', control: 'text' }
	];

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
			? settingsFields
			: node.kind === 'section'
				? sectionFields
				: node.kind === 'column'
					? columnFields
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
		<FieldControl {field} {target} />
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
