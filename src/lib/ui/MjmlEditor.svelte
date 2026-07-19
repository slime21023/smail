<script lang="ts">
	import { untrack } from 'svelte';
	import { compile } from '../core/compiler/compile.js';
	import type { MjmlError } from 'mjml-browser';
	import { createRegistry, type AnyBlockDefinition } from '../core/registry/registry.js';
	import type { StructuralFields } from '../core/registry/structural.js';
	import type { ControlRegistry } from '../core/registry/types.js';
	import { createBlock, createSection } from '../core/schema/defaults.js';
	import {
		addColumn as addColumnOp,
		duplicateBlock,
		duplicateSection,
		findNode,
		insertSection,
		moveSection as moveSectionOp,
		removeColumn as removeColumnOp,
		removeNode as removeNodeOp,
		targetColumn
	} from '../core/schema/tree.js';
	import type { BlockType, EditorState } from '../core/schema/types.js';
	import { serializeToMjml } from '../core/serializer/serializeToMjml.js';
	import { HistoryStore } from '../store/history.svelte.js';
	import BlockPalette from './BlockPalette.svelte';
	import Canvas from './Canvas.svelte';
	import Inspector from './Inspector.svelte';
	import Preview from './Preview.svelte';
	import Toolbar from './Toolbar.svelte';
	import { themeStyle, type ThemeTokens } from './theme.js';
	import './theme.css';

	interface Props {
		state: EditorState;
		onChange?: (state: EditorState) => void;
		onExport?: (html: string, json: string) => void;
		blocks?: AnyBlockDefinition[];
		/** Custom inspector controls, addressed by `InspectorField.control` name. */
		controls?: ControlRegistry;
		/** Override the inspector fields of section / column / document nodes. */
		structuralFields?: StructuralFields;
		theme?: ThemeTokens;
		readonly?: boolean;
	}

	let {
		state: doc = $bindable(),
		onChange,
		onExport,
		blocks = [],
		controls,
		structuralFields,
		theme = {},
		readonly = false
	}: Props = $props();

	let registry = $derived(createRegistry(blocks));

	let selectedId = $state<string | null>(null);
	let previewMode = $state<'desktop' | 'mobile'>('desktop');
	let html = $state('');
	let compileErrors = $state<MjmlError[]>([]);

	let mjml = $derived(serializeToMjml(doc, registry));
	let selectedNode = $derived(selectedId === null ? null : findNode(doc, selectedId));

	const history = new HistoryStore();

	// Recompile (debounced) whenever the serialized document changes.
	// untrack keeps this effect depending on `mjml` only — the onChange prop
	// identity can change on every parent render (inline arrows), and tracking
	// it here would loop the effect.
	let firstRun = true;
	$effect(() => {
		const current = mjml;
		if (firstRun) {
			firstRun = false;
		} else {
			untrack(() => onChange?.(doc));
		}
		const timer = setTimeout(async () => {
			history.capture(current, $state.snapshot(doc) as EditorState);
			const result = await compile(current);
			// Ignore stale results from an earlier edit.
			if (current === mjml) {
				html = result.html;
				compileErrors = result.errors;
			}
		}, 300);
		return () => clearTimeout(timer);
	});

	function restore(snapshot: EditorState | null) {
		if (!snapshot) return;
		doc.settings = snapshot.settings;
		doc.body = snapshot.body;
		selectedId = null;
	}

	function handleShortcuts(event: KeyboardEvent) {
		if (readonly || !(event.ctrlKey || event.metaKey)) return;
		// Leave native text-editing undo alone inside form fields.
		const target = event.target as HTMLElement | null;
		if (target && ('value' in target || target.isContentEditable)) return;
		const key = event.key.toLowerCase();
		if (key === 'z' && !event.shiftKey) {
			event.preventDefault();
			restore(history.undo());
		} else if (key === 'y' || (key === 'z' && event.shiftKey)) {
			event.preventDefault();
			restore(history.redo());
		}
	}

	function addSection(columns = 1) {
		const section = insertSection(doc, createSection(columns));
		selectedId = section.id;
	}

	function addBlock(type: string) {
		let column = targetColumn(doc, selectedId);
		if (!column) {
			doc.body.push(createSection(1));
			column = doc.body[doc.body.length - 1].columns[0];
		}
		const block = createBlock(type as BlockType, registry);
		column.blocks.push(block);
		selectedId = block.id;
	}

	function removeNode(id: string) {
		if (removeNodeOp(doc, id)) selectedId = null;
	}

	function duplicateNode(id: string) {
		const node = findNode(doc, id);
		if (!node) return;
		const clone =
			node.kind === 'section' ? duplicateSection(doc, id) : duplicateBlock(doc, id);
		if (clone) selectedId = clone.id;
	}

	function moveSection(id: string, offset: -1 | 1) {
		moveSectionOp(doc, id, offset);
	}

	function addColumn(sectionId: string) {
		const column = addColumnOp(doc, sectionId);
		if (column) selectedId = column.id;
	}

	function removeColumn(columnId: string) {
		if (removeColumnOp(doc, columnId)) selectedId = null;
	}

	function download(filename: string, content: string, type: string) {
		const url = URL.createObjectURL(new Blob([content], { type }));
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = filename;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	async function exportHtml() {
		// Compile fresh so exports never ship a stale (debounced) preview.
		const result = await compile(mjml);
		const json = JSON.stringify(doc, null, 2);
		if (onExport) {
			onExport(result.html, json);
		} else {
			download('email.html', result.html, 'text/html');
		}
	}

	function exportJson() {
		download('email.json', JSON.stringify(doc, null, 2), 'application/json');
	}
</script>

<svelte:window onkeydown={handleShortcuts} />

<div class="sme-root" class:sme-readonly={readonly} style={themeStyle(theme)}>
	<Toolbar
		{previewMode}
		{readonly}
		canUndo={history.canUndo}
		canRedo={history.canRedo}
		onUndo={() => restore(history.undo())}
		onRedo={() => restore(history.redo())}
		onPreviewMode={(mode) => (previewMode = mode)}
		onExportHtml={exportHtml}
		onExportJson={exportJson}
	/>
	<div class="sme-main">
		{#if !readonly}
			<aside class="sme-pane sme-pane-left">
				<BlockPalette {registry} onAdd={addBlock} />
			</aside>
		{/if}
		<section class="sme-pane sme-pane-canvas" aria-label="Canvas">
			<Canvas
				body={doc.body}
				width={doc.settings.width}
				backgroundColor={doc.settings.backgroundColor}
				fontFamily={doc.settings.fontFamily}
				textColor={doc.settings.textColor}
				{selectedId}
				{readonly}
				onSelect={(id) => (selectedId = id)}
				onAddSection={addSection}
				onReorderSections={(sections) => (doc.body = sections)}
				onMoveSection={moveSection}
				onDuplicate={duplicateNode}
				{registry}
			/>
		</section>
		<section class="sme-pane sme-pane-preview" aria-label="Preview">
			<Preview {html} errors={compileErrors} mode={previewMode} />
		</section>
		{#if !readonly}
			<aside class="sme-pane sme-pane-right">
				<Inspector
					node={selectedNode}
					settings={doc.settings}
					{registry}
					{controls}
					structural={structuralFields}
					onDelete={removeNode}
					onAddColumn={addColumn}
					onRemoveColumn={removeColumn}
				/>
			</aside>
		{/if}
	</div>
</div>

<style>
	.sme-root {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 480px;
		font-family: var(--sme-font);
		color: var(--sme-text);
		background: var(--sme-bg);
	}

	.sme-main {
		flex: 1;
		display: grid;
		grid-template-columns: 170px minmax(0, 1.2fr) minmax(0, 1fr) 250px;
		min-height: 0;
	}

	.sme-readonly .sme-main {
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
	}

	.sme-pane {
		min-height: 0;
		overflow-y: auto;
	}

	.sme-pane-left {
		background: var(--sme-panel-bg);
		border-right: 1px solid var(--sme-border);
	}

	.sme-pane-canvas {
		background: var(--sme-canvas-bg);
	}

	.sme-pane-preview {
		background: var(--sme-bg);
		border-left: 1px solid var(--sme-border);
	}

	.sme-pane-right {
		background: var(--sme-panel-bg);
		border-left: 1px solid var(--sme-border);
	}
</style>
