<script lang="ts">
	import { untrack } from 'svelte';
	import { compile } from '../core/compiler/compile.js';
	import { exportEmail, type EmailExport } from '../core/template/exportEmail.js';
	import {
		createTemplateFile,
		parseTemplateFile,
		serializeTemplateFile,
		type TemplateFile
	} from '../core/template/template.js';
	import type { MjmlError } from 'mjml-browser';
	import { createRegistry, type AnyBlockDefinition } from '../core/registry/registry.js';
	import {
		DEFAULT_DELIMITERS,
		extractParams,
		isValidParameterKey,
		mergeParams,
		substituteParams,
		type ParamDelimiters
	} from '../core/params/params.js';
	import type { StructuralFields } from '../core/registry/structural.js';
	import type { ControlRegistry, TextEditorProps } from '../core/registry/types.js';
	import type { Component } from 'svelte';
	import type { ParameterDef } from '../core/schema/types.js';
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
		setColumnWidth as setColumnWidthOp,
		targetColumn
	} from '../core/schema/tree.js';
	import type { BlockType, EditorState } from '../core/schema/types.js';
	import { serializeToMjml } from '../core/serializer/serializeToMjml.js';
	import { HistoryStore } from '../store/history.svelte.js';
	import BlockPalette from './BlockPalette.svelte';
	import Canvas from './Canvas.svelte';
	import { setEditorContext } from './context.js';
	import Inspector from './Inspector.svelte';
	import Preview from './Preview.svelte';
	import Toolbar from './Toolbar.svelte';
	import { themeStyle, type ThemeTokens } from './theme.js';
	import './theme.css';

	interface Props {
		/** Controlled document; use `bind:state` when the host owns the mutable value. */
		state: EditorState;
		/** Called after a user-initiated document change, not during the initial render. */
		onChange?: (state: EditorState) => void;
		/** Legacy HTML + bare state JSON callback. */
		onExport?: (html: string, json: string) => void;
		/** Receives a versioned file instead of triggering the default template download. */
		onTemplateExport?: (file: TemplateFile) => void;
		/** Receives fresh compiled delivery output whenever Export HTML is chosen. */
		onDeliveryExport?: (exported: EmailExport) => void;
		blocks?: AnyBlockDefinition[];
		/** Custom inspector controls, addressed by `InspectorField.control` name. */
		controls?: ControlRegistry;
		/** Inspector-only replacement for the built-in rich text editor. */
		textEditor?: Component<TextEditorProps>;
		/** Override the inspector fields of section / column / document nodes. */
		structuralFields?: StructuralFields;
		/** Merge-field declarations (e.g. {{firstName}}). Merged over any stored in state.settings.parameters. */
		parameters?: ParameterDef[];
		/** Placeholder delimiters; default {{ }}. */
		paramDelimiters?: ParamDelimiters;
		/** Persist the merged declarations into state.settings.parameters (default true). */
		persistParameters?: boolean;
		/** When provided, the image inspector offers an Upload button; resolve to the hosted URL. */
		onImageUpload?: (file: File) => Promise<string>;
		/** Token keys map to `--sme-<key>` on this editor root. */
		theme?: ThemeTokens;
		/** Hides mutation controls and import while retaining preview and export. */
		readonly?: boolean;
	}

	let {
		state: doc = $bindable(),
		onChange,
		onExport,
		onTemplateExport,
		onDeliveryExport,
		blocks = [],
		controls,
		textEditor,
		structuralFields,
		parameters,
		paramDelimiters,
		persistParameters = true,
		onImageUpload,
		theme = {},
		readonly = false
	}: Props = $props();

	let registry = $derived(createRegistry(blocks));

	let selectedId = $state<string | null>(null);
	let previewMode = $state<'desktop' | 'mobile'>('desktop');
	let sampleData = $state(false);
	let html = $state('');
	let compileErrors = $state<MjmlError[]>([]);
	let importError = $state<string | undefined>();

	let mjml = $derived(serializeToMjml(doc, registry));
	let selectedNode = $derived(selectedId === null ? null : findNode(doc, selectedId));

	// Template parameters (merge fields)
	let delims = $derived(paramDelimiters ?? DEFAULT_DELIMITERS);
	let effectiveParams = $derived(mergeParams(doc.settings.parameters, parameters));
	// Only warn about undeclared placeholders when the host opted into params at
	// all — otherwise literal {{ }} text must stay noise-free.
	let paramsActive = $derived(
		parameters !== undefined || (doc.settings.parameters?.length ?? 0) > 0
	);
	let sampleValues = $derived(
		Object.fromEntries(
			effectiveParams.filter((p) => p.sample !== undefined).map((p) => [p.key, p.sample!])
		)
	);
	let previewHtml = $derived(sampleData ? substituteParams(html, sampleValues, delims) : html);
	let paramWarnings = $derived(
		paramsActive
			? extractParams(mjml, delims)
					.filter((key) => !effectiveParams.some((p) => p.key === key))
					.map((key) => `Undeclared parameter: ${delims.open}${key}${delims.close}`)
			: []
	);

	// Persist merged declarations into the document so exported templates are
	// self-describing. Never touches mjml, so no compile churn.
	$effect(() => {
		if (!parameters || !persistParameters) return;
		const merged = mergeParams(untrack(() => doc.settings.parameters), parameters);
		untrack(() => {
			if (JSON.stringify(doc.settings.parameters ?? []) !== JSON.stringify(merged)) {
				doc.settings.parameters = merged;
			}
		});
	});

	const history = new HistoryStore();

	function createParameter(key: string, label?: string): ParameterDef | null {
		const normalized = key.trim();
		if (!isValidParameterKey(normalized)) return null;
		const existing = effectiveParams.find((parameter) => parameter.key === normalized);
		if (existing) return existing;
		const created: ParameterDef = { key: normalized, label: label?.trim() || normalized };
		doc.settings.parameters = [...(doc.settings.parameters ?? []), created];
		return created;
	}

	// Live via getters — context itself must be set exactly once, at init.
	setEditorContext({
		get onImageUpload() {
			return onImageUpload;
		},
		get parameters() {
			return effectiveParams;
		},
		get delimiters() {
			return delims;
		},
		createParameter(key, label) {
			return createParameter(key, label);
		}
	});

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

	function setColumnWidth(columnId: string, percent: number) {
		const node = findNode(doc, columnId);
		if (node?.kind === 'column') setColumnWidthOp(node.section, columnId, percent);
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
		const result = await exportEmail(doc, { registry });
		const json = JSON.stringify(doc, null, 2);
		onDeliveryExport?.(result);
		if (onExport) onExport(result.html, json);
		if (!onExport && !onDeliveryExport) {
			download('email.html', result.html, 'text/html');
		}
	}

	function exportJson() {
		download('email.json', JSON.stringify(doc, null, 2), 'application/json');
	}

	function exportTemplate() {
		const file = createTemplateFile(doc);
		if (onTemplateExport) onTemplateExport(file);
		else download('email.smail.json', serializeTemplateFile(doc), 'application/json');
	}

	async function importTemplate(file: File) {
		if (readonly) return;
		try {
			const result = parseTemplateFile(await file.text(), { registry });
			if (!result.ok) {
				importError = result.errors.map((error) => `${error.path}: ${error.message}`).join(' ');
				return;
			}
			importError = undefined;
			doc = result.value.state;
			selectedId = null;
			history.clear();
		} catch {
			importError = 'Unable to read this template file.';
		}
	}
</script>

<svelte:window onkeydown={handleShortcuts} />

<div class="sme-root" class:sme-readonly={readonly} style={themeStyle(theme)}>
	<Toolbar
		{previewMode}
		{readonly}
		canUndo={history.canUndo}
		canRedo={history.canRedo}
		hasParams={effectiveParams.length > 0}
		{sampleData}
		onToggleSample={(on) => (sampleData = on)}
		onUndo={() => restore(history.undo())}
		onRedo={() => restore(history.redo())}
		onPreviewMode={(mode) => (previewMode = mode)}
		onImportTemplate={importTemplate}
		onExportTemplate={exportTemplate}
		onExportHtml={exportHtml}
		onExportJson={exportJson}
		{importError}
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
			<Preview html={previewHtml} errors={compileErrors} warnings={paramWarnings} mode={previewMode} />
		</section>
		{#if !readonly}
			<aside class="sme-pane sme-pane-right">
				<Inspector
					node={selectedNode}
					settings={doc.settings}
					{registry}
					{controls}
					{textEditor}
					parameters={effectiveParams}
					hostParameters={parameters ?? []}
					delimiters={delims}
					{createParameter}
					structural={structuralFields}
					onDelete={removeNode}
					onAddColumn={addColumn}
					onRemoveColumn={removeColumn}
					onSetColumnWidth={setColumnWidth}
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
