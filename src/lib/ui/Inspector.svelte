<script lang="ts">
	import type { Component } from 'svelte';
	import type { ParamDelimiters } from '../core/params/params.js';
	import type { BlockRegistry } from '../core/registry/registry.js';
	import {
		columnFields,
		sectionFields,
		settingsFields,
		type StructuralFields
	} from '../core/registry/structural.js';
	import type { ControlRegistry, TextEditorProps } from '../core/registry/types.js';
	import type { NodeRef } from '../core/schema/tree.js';
	import { SOCIAL_NETWORKS, type DocumentSettings, type ParameterDef, type SocialElement, type TrackingSettings as TrackingSettingsValue } from '../core/schema/types.js';
	import FieldControl from './FieldControl.svelte';
	import ColumnWidthControl from './ColumnWidthControl.svelte';
	import InspectorTextEditor from './InspectorTextEditor.svelte';
	import ParameterManager from './ParameterManager.svelte';
	import TrackingSettings from './TrackingSettings.svelte';

	import { MAX_COLUMNS } from '../core/schema/tree.js';

	interface Props {
		node: NodeRef | null;
		settings: DocumentSettings;
		registry: BlockRegistry;
		onDelete: (id: string) => void;
		onAddColumn: (sectionId: string) => void;
		onRemoveColumn: (columnId: string) => void;
		onSetColumnWidth: (columnId: string, percent: number) => void;
		controls?: ControlRegistry;
		structural?: StructuralFields;
		textEditor?: Component<TextEditorProps>;
		parameters: ParameterDef[];
		hostParameters: ParameterDef[];
		delimiters: ParamDelimiters;
		createParameter: (key: string, label?: string) => ParameterDef | null;
		onSetField: (nodeId: string | null, key: string, value: unknown) => void;
		onSetTextContent: (blockId: string, html: string) => void;
		onSetTracking: (tracking: TrackingSettingsValue) => void;
		onSetParameters: (parameters: ParameterDef[]) => void;
	}

	let {
		node,
		settings,
		registry,
		onDelete,
		onAddColumn,
		onRemoveColumn,
		onSetColumnWidth,
		controls,
		structural = {},
		textEditor,
		parameters,
		hostParameters,
		delimiters,
		createParameter
		,
		onSetField,
		onSetTextContent,
		onSetTracking,
		onSetParameters
	}: Props = $props();

	let TextEditor = $derived(textEditor ?? InspectorTextEditor);

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
		(node === null
			? (structural.settings ?? settingsFields)
			: node.kind === 'section'
				? (structural.section ?? sectionFields)
				: node.kind === 'column'
					? (structural.column ?? columnFields)
					: (registry.get(node.block.type)?.inspector ?? [])).filter(
			(field) =>
				!(node?.kind === 'block' && node.block.type === 'text' && field.key === 'content') &&
				!(node?.kind === 'column' && field.key === 'width')
		)
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

	// The last column of a section cannot be deleted (tree.removeColumn refuses).
	let deleteDisabled = $derived(node?.kind === 'column' && node.section.columns.length <= 1);

	function setTextContent(value: string) {
		if (node?.kind !== 'block' || node.block.type !== 'text') return;
		onSetTextContent(node.block.id, value);
	}

	function setField(key: string, value: unknown) {
		onSetField(node === null ? null : node.kind === 'section' ? node.section.id : node.kind === 'column' ? node.column.id : node.block.id, key, value);
	}

	function socialRows(field: string): SocialElement[] {
		return (target[field] as SocialElement[] | undefined) ?? [];
	}

	function updateSocial(field: string, index: number, patch: Partial<SocialElement>) {
		setField(field, socialRows(field).map((row, candidate) => (candidate === index ? { ...row, ...patch } : row)));
	}

	function removeSocial(field: string, index: number) {
		setField(field, socialRows(field).filter((_, candidate) => candidate !== index));
	}

	function addSocial(field: string) {
		setField(field, [...socialRows(field), { network: 'web', href: 'https://' }]);
	}
</script>

<div class="sme-inspector">
	<p class="sme-inspector-heading">{heading}</p>

	{#if node?.kind === 'section'}
		<div class="sme-columns-row">
			<span>Columns: {node.section.columns.length}</span>
			<button
				type="button"
				disabled={node.section.columns.length >= MAX_COLUMNS}
				onclick={() => onAddColumn(node.section.id)}
			>
				+ Add column
			</button>
		</div>
	{/if}

	{#if node?.kind === 'column'}
		<ColumnWidthControl section={node.section} column={node.column} onSetWidth={onSetColumnWidth} />
	{/if}

	{#each fields as field (field.key)}
		{#if field.control === 'socialLinks'}
			<div class="sme-field">
				<span class="sme-field-label">{field.label}</span>
				<div class="sme-social-links">
					{#each socialRows(field.key) as row, index (index)}
						<div class="sme-social-row">
							<select value={row.network} onchange={(event) => updateSocial(field.key, index, { network: event.currentTarget.value as SocialElement['network'] })}>
								{#each SOCIAL_NETWORKS as network (network)}<option value={network}>{network}</option>{/each}
							</select>
							<input
								type="text"
								value={row.href}
								oninput={(event) => updateSocial(field.key, index, { href: event.currentTarget.value })}
								onchange={(event) => updateSocial(field.key, index, { href: event.currentTarget.value })}
								onblur={(event) => updateSocial(field.key, index, { href: event.currentTarget.value })}
							/>
							<button type="button" aria-label="Remove link" onclick={() => removeSocial(field.key, index)}>✕</button>
						</div>
					{/each}
					<button type="button" class="sme-social-add" onclick={() => addSocial(field.key)}>+ Add link</button>
				</div>
			</div>
		{:else}
			<FieldControl {field} {target} onSetValue={setField} {controls} />
		{/if}
	{/each}

	{#if node?.kind === 'block' && node.block.type === 'text'}
		<div class="sme-text-editor-field">
			<span class="sme-inspector-heading">Content</span>
			<TextEditor
				value={node.block.props.content}
				setValue={setTextContent}
				disabled={false}
				{parameters}
				{delimiters}
				{createParameter}
			/>
		</div>
	{/if}

	{#if node === null}
		<TrackingSettings {settings} {onSetTracking} />
		<ParameterManager {settings} {hostParameters} {onSetParameters} />
	{/if}

	{#if node?.kind === 'column'}
		<button
			type="button"
			class="sme-delete"
			disabled={deleteDisabled}
			title={deleteDisabled ? 'A section needs at least one column' : undefined}
			onclick={() => onRemoveColumn(node.column.id)}
		>
			Remove column
		</button>
	{:else if deletableId !== null}
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

	.sme-text-editor-field { display: flex; flex-direction: column; gap: 4px; }
	.sme-field { display: flex; flex-direction: column; gap: 4px; }
	.sme-field-label { font-size: 11px; font-weight: 600; color: var(--sme-text-muted, #64748b); }
	.sme-social-links { display: flex; flex-direction: column; gap: 4px; }
	.sme-social-row { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr) auto; gap: 4px; }
	.sme-social-row select, .sme-social-row input, .sme-social-row button, .sme-social-add { font: inherit; font-size: 12px; border: 1px solid var(--sme-border, #e2e8f0); border-radius: var(--sme-radius, 6px); background: var(--sme-panel-bg, #fff); color: var(--sme-text, #0f172a); padding: 4px; min-width: 0; }
	.sme-social-row button { color: #b91c1c; cursor: pointer; }
	.sme-social-add { align-self: flex-start; color: var(--sme-accent, #2563eb); cursor: pointer; }

	.sme-columns-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		font-size: 12px;
		color: var(--sme-text-muted, #64748b);
	}

	.sme-columns-row button {
		border: 1px dashed var(--sme-border, #e2e8f0);
		background: var(--sme-panel-bg, #ffffff);
		color: var(--sme-accent, #2563eb);
		border-radius: var(--sme-radius, 6px);
		padding: 3px 8px;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.sme-columns-row button:disabled {
		color: var(--sme-text-muted, #64748b);
		cursor: not-allowed;
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

	.sme-delete:hover:not(:disabled) {
		background: #fee2e2;
	}

	.sme-delete:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
