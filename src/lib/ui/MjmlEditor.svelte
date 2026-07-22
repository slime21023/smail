<script lang="ts">
	import { compile } from '../core/compiler/compile.js';
	import {
		extractParams,
		substituteParams
	} from '../core/params/params.js';
	import { serializeToMjml } from '../core/serializer/serializeToMjml.js';
	import { findNode } from '../core/schema/tree.js';
	import { onMount } from 'svelte';
	import type { EditorState } from '../core/schema/types.js';
	import type { MjmlError } from 'mjml-browser';
	import type { MjmlEditorProps } from './types.js';
	import BlockPalette from './BlockPalette.svelte';
	import Canvas from './Canvas.svelte';
	import { setEditorContext } from './context.js';
	import Inspector from './Inspector.svelte';
	import Preview from './Preview.svelte';
	import Toolbar from './Toolbar.svelte';
	import { themeStyle } from './theme.js';
	import './theme.css';

	let { editor, theme = {}, readonly = false }: MjmlEditorProps = $props();

	let previewMode = $state<'desktop' | 'mobile'>('desktop');
	let sampleData = $state(false);
	let html = $state('');
	let compileErrors = $state<MjmlError[]>([]);
	let importError = $state<string | undefined>();
	// The controller is intentionally captured once per editor mount. Changing
	// controller instances remounts the host view in normal Svelte usage.
	// svelte-ignore state_referenced_locally
	let renderState = $state<EditorState>(editor.getState());
	let renderRevision = $state(0);
	// svelte-ignore state_referenced_locally
	let selectedId = $state<string | null>(editor.selectedId);

	let doc = $derived(renderState);
	let selectedNode = $derived(selectedId === null ? null : findNode(doc, selectedId));
	// The Canvas receives a private snapshot. Its transient dnd mutations cannot
	// leak back into the controller; every committed controller change replaces
	// the snapshot and resets dndzone with fresh item identities.
	onMount(() =>
		editor.subscribe(({ state }) => {
			renderState = state;
			renderRevision++;
			selectedId = editor.selectedId;
		})
	);
	let mjml = $derived(serializeToMjml(renderState, editor.registry));
	let effectiveParams = $derived(editor.parameters);
	let sampleValues = $derived(
		Object.fromEntries(
			effectiveParams.filter((p) => p.sample !== undefined).map((p) => [p.key, p.sample!])
		)
	);
	let previewHtml = $derived(
		sampleData ? substituteParams(html, sampleValues, editor.delimiters) : html
	);
	let paramsActive = $derived(
		editor.hostParameters.length > 0 || (doc.settings.parameters?.length ?? 0) > 0
	);
	let paramWarnings = $derived(
		paramsActive
			? extractParams(mjml, editor.delimiters)
					.filter((key) => !effectiveParams.some((p) => p.key === key))
					.map((key) => `Undeclared parameter: ${editor.delimiters.open}${key}${editor.delimiters.close}`)
			: []
	);

	// Context is set once; getters keep nested rich-text controls connected to
	// the current controller configuration without prop drilling.
	setEditorContext({
		get onImageUpload() {
			return editor.onImageUpload;
		},
		get parameters() {
			return editor.parameters;
		},
		get delimiters() {
			return editor.delimiters;
		},
		createParameter(key, label) {
			return editor.createParameter(key, label);
		}
	});

	// Compilation is intentionally a browser concern. State-only controller
	// changes do not recompile MJML, while a revision guard discards stale work.
	$effect(() => {
		const current = mjml;
		const timer = setTimeout(async () => {
			const result = await compile(current);
			if (current === mjml) {
				html = result.html;
				compileErrors = result.errors;
			}
		}, 300);
		return () => clearTimeout(timer);
	});

	function handleShortcuts(event: KeyboardEvent) {
		if (readonly || !(event.ctrlKey || event.metaKey)) return;
		const target = event.target as HTMLElement | null;
		if (target && ('value' in target || target.isContentEditable)) return;
		const key = event.key.toLowerCase();
		if (key === 'z' && !event.shiftKey) {
			event.preventDefault();
			editor.undo();
		} else if (key === 'y' || (key === 'z' && event.shiftKey)) {
			event.preventDefault();
			editor.redo();
		}
	}

	function download(filename: string, content: string, type: string) {
		const url = URL.createObjectURL(new Blob([content], { type }));
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = filename;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	function refreshView() {
		renderState = editor.getState();
		renderRevision++;
	}

	function setInspectorField(nodeId: string | null, key: string, value: unknown) {
		editor.setField(nodeId, key, value);
		refreshView();
	}

	function select(id: string | null) {
		editor.select(id);
		selectedId = id;
	}

	async function exportHtml() {
		const exported = await editor.exportDelivery();
		if (!editor.hasDeliveryExportHandler) download('email.html', exported.html, 'text/html');
	}

	function exportTemplate() {
		const file = editor.exportTemplate();
		if (!editor.hasTemplateExportHandler) {
			download('email.smail.json', JSON.stringify(file, null, 2), 'application/json');
		}
	}

	async function importTemplate(file: File) {
		if (readonly) return;
		try {
			const result = editor.importTemplate(await file.text());
			if (!result.ok) {
				importError = result.errors.map((error) => `${error.path}: ${error.message}`).join(' ');
				return;
			}
			importError = undefined;
		} catch {
			importError = 'Unable to read this template file.';
		}
	}
</script>

<svelte:window onkeydown={handleShortcuts} />

<div
	class="sme-root"
	class:sme-readonly={readonly}
	style={themeStyle(theme)}
>
	<Toolbar
		{previewMode}
		{readonly}
		canUndo={editor.canUndo}
		canRedo={editor.canRedo}
		hasParams={effectiveParams.length > 0}
		{sampleData}
		onToggleSample={(on) => (sampleData = on)}
		onUndo={() => editor.undo()}
		onRedo={() => editor.redo()}
		onPreviewMode={(mode) => (previewMode = mode)}
		onImportTemplate={importTemplate}
		onExportTemplate={exportTemplate}
		onExportHtml={exportHtml}
		{importError}
	/>
	<div class="sme-main">
		{#if !readonly}
			<aside class="sme-pane sme-pane-left">
				<BlockPalette registry={editor.registry} onAdd={(type) => editor.addBlock(type)} />
			</aside>
		{/if}
		<section class="sme-pane sme-pane-canvas" aria-label="Canvas">
			{#key renderRevision}
				<Canvas
					body={doc.body}
					width={doc.settings.width}
					backgroundColor={doc.settings.backgroundColor}
					fontFamily={doc.settings.fontFamily}
					textColor={doc.settings.textColor}
					{selectedId}
					{readonly}
					onSelect={select}
					onAddSection={(columns) => editor.addSection(columns)}
					onReorderSections={(sections) => editor.replaceSections(sections)}
					onReplaceColumnBlocks={(columnId, blocks) => editor.setColumnBlocks(columnId, blocks)}
					onMoveSection={(id, offset) => editor.moveSection(id, offset)}
					onDuplicate={(id) => editor.duplicate(id)}
					onSetTextContent={(id, html) => editor.setTextContent(id, html)}
					onSetButtonText={(id, text) => editor.setField(id, 'text', text)}
					registry={editor.registry}
				/>
			{/key}
		</section>
		<section class="sme-pane sme-pane-preview" aria-label="Preview">
			<Preview html={previewHtml} errors={compileErrors} warnings={paramWarnings} mode={previewMode} />
		</section>
		{#if !readonly}
			<aside class="sme-pane sme-pane-right">
				<Inspector
					node={selectedNode}
					settings={doc.settings}
					registry={editor.registry}
					controls={editor.controls}
					textEditor={editor.textEditor}
					parameters={effectiveParams}
					hostParameters={[...editor.hostParameters]}
					delimiters={editor.delimiters}
					createParameter={(key, label) => editor.createParameter(key, label)}
					structural={editor.structuralFields}
					onDelete={(id) => editor.remove(id)}
					onAddColumn={(id) => editor.addColumn(id)}
					onRemoveColumn={(id) => editor.removeColumn(id)}
					onSetColumnWidth={(id, percent) => editor.setColumnWidth(id, percent)}
					onSetField={setInspectorField}
					onSetTextContent={(id, html) => editor.setTextContent(id, html)}
					onSetTracking={(tracking) => editor.setTracking(tracking)}
					onSetParameters={(parameters) => editor.setParameters(parameters)}
				/>
			</aside>
		{/if}
	</div>
</div>

<style>
	.sme-root { display: flex; flex-direction: column; height: 100%; min-height: 480px; font-family: var(--sme-font); color: var(--sme-text); background: var(--sme-bg); }
	.sme-main { flex: 1; display: grid; grid-template-columns: 170px minmax(0, 1.2fr) minmax(0, 1fr) 250px; min-height: 0; }
	.sme-readonly .sme-main { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); }
	.sme-pane { min-height: 0; overflow-y: auto; }
	.sme-pane-left { background: var(--sme-panel-bg); border-right: 1px solid var(--sme-border); }
	.sme-pane-canvas { background: var(--sme-canvas-bg); }
	.sme-pane-preview { background: var(--sme-bg); border-left: 1px solid var(--sme-border); }
	.sme-pane-right { background: var(--sme-panel-bg); border-left: 1px solid var(--sme-border); }
</style>
