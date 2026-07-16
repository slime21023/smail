<script lang="ts">
	import { untrack } from 'svelte';
	import { compile } from '../core/compiler/compile.js';
	import type { MjmlError } from 'mjml-browser';
	import { createRegistry, type AnyBlockDefinition } from '../core/registry/registry.js';
	import { createBlock, createSection } from '../core/schema/defaults.js';
	import { findNode, targetColumn } from '../core/schema/tree.js';
	import type { BlockType, EditorState } from '../core/schema/types.js';
	import { serializeToMjml } from '../core/serializer/serializeToMjml.js';
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
		theme?: ThemeTokens;
		readonly?: boolean;
	}

	let {
		state: doc = $bindable(),
		onChange,
		onExport,
		blocks = [],
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
			const result = await compile(current);
			// Ignore stale results from an earlier edit.
			if (current === mjml) {
				html = result.html;
				compileErrors = result.errors;
			}
		}, 300);
		return () => clearTimeout(timer);
	});

	function addSection() {
		const section = createSection(1);
		doc.body.push(section);
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
		const node = findNode(doc, id);
		if (!node) return;
		if (node.kind === 'section') {
			doc.body.splice(doc.body.indexOf(node.section), 1);
		} else if (node.kind === 'column') {
			node.section.columns.splice(node.section.columns.indexOf(node.column), 1);
		} else {
			node.column.blocks.splice(node.column.blocks.indexOf(node.block), 1);
		}
		selectedId = null;
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

<div class="sme-root" class:sme-readonly={readonly} style={themeStyle(theme)}>
	<Toolbar
		{previewMode}
		{readonly}
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
				{registry}
			/>
		</section>
		<section class="sme-pane sme-pane-preview" aria-label="Preview">
			<Preview {html} errors={compileErrors} mode={previewMode} />
		</section>
		{#if !readonly}
			<aside class="sme-pane sme-pane-right">
				<Inspector node={selectedNode} settings={doc.settings} {registry} onDelete={removeNode} />
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
