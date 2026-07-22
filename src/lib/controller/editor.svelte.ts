import { createBlock, createSection } from '../core/schema/defaults.js';
import {
	addColumn,
	duplicateBlock,
	duplicateSection,
	findNode,
	insertSection,
	moveSection,
	removeColumn,
	removeNode,
	setColumnWidth,
	targetColumn,
	type NodeRef
} from '../core/schema/tree.js';
import type { Block, BlockType, EditorState, ParameterDef, Section, TrackingSettings } from '../core/schema/types.js';
import {
	DEFAULT_DELIMITERS,
	isValidParameterKey,
	mergeParams,
	type ParamDelimiters
} from '../core/params/params.js';
import { createRegistry, type AnyBlockDefinition, type BlockRegistry } from '../core/registry/registry.js';
import type { ControlRegistry, TextEditorProps } from '../core/registry/types.js';
import type { StructuralFields } from '../core/registry/structural.js';
import {
	createTemplateFile,
	parseTemplateFile,
	type TemplateFile,
	type TemplateParseResult
} from '../core/template/template.js';
import { exportEmail, type EmailExport } from '../core/template/exportEmail.js';
import { sanitizeTextHtml } from '../core/text/sanitize.js';
import { HistoryStore } from '../store/history.svelte.js';
import type { Component } from 'svelte';

/** Reason a controller emitted a new document snapshot. */
export type EditorChangeSource = 'command' | 'undo' | 'redo' | 'import' | 'replace';

/** Immutable event delivered after a controller-owned document change. */
export interface EditorChange {
	source: EditorChangeSource;
	state: EditorState;
}

export type EditorChangeListener = (change: EditorChange) => void;

/** Configuration captured by a controller for its complete lifetime. */
export interface EditorOptions {
	state: EditorState;
	blocks?: AnyBlockDefinition[];
	controls?: ControlRegistry;
	textEditor?: Component<TextEditorProps>;
	structuralFields?: StructuralFields;
	parameters?: ParameterDef[];
	paramDelimiters?: ParamDelimiters;
	persistParameters?: boolean;
	onImageUpload?: (file: File) => Promise<string>;
	onChange?: EditorChangeListener;
	onTemplateExport?: (file: TemplateFile) => void;
	onDeliveryExport?: (exported: EmailExport) => void;
}

/** Public command result for mutations that may be rejected by document rules. */
export interface EditorCommandResult {
	ok: boolean;
}

/**
 * Controller-owned editor session. `document` is a reactive read-only view for
 * `MjmlEditor`; hosts must use commands, `replaceState`, or `importTemplate`
 * rather than mutating it directly. `getState` always returns an isolated clone.
 */
export class EditorController {
	#document = $state<EditorState>({} as EditorState);
	#selectedId = $state<string | null>(null);
	#hostParameters = $state.raw<ParameterDef[]>([]);
	#revision = $state(0);
	#history = new HistoryStore();
	#listeners = new Set<EditorChangeListener>();
	readonly registry: BlockRegistry;
	readonly controls?: ControlRegistry;
	readonly textEditor?: Component<TextEditorProps>;
	readonly structuralFields?: StructuralFields;
	readonly delimiters: ParamDelimiters;
	readonly persistParameters: boolean;
	readonly onImageUpload?: (file: File) => Promise<string>;
	readonly #onTemplateExport?: (file: TemplateFile) => void;
	readonly #onDeliveryExport?: (exported: EmailExport) => void;

	constructor(options: EditorOptions) {
		this.registry = createRegistry(options.blocks);
		this.controls = options.controls;
		this.textEditor = options.textEditor;
		this.structuralFields = options.structuralFields;
		this.delimiters = options.paramDelimiters ?? DEFAULT_DELIMITERS;
		this.persistParameters = options.persistParameters ?? true;
		this.onImageUpload = options.onImageUpload;
		this.#onTemplateExport = options.onTemplateExport;
		this.#onDeliveryExport = options.onDeliveryExport;
		this.#document = structuredClone(options.state);
		this.#hostParameters = structuredClone(options.parameters ?? []);
		this.#persistHostParameters();
		this.#history.capture(this.getState());
		if (options.onChange) this.#listeners.add(options.onChange);
	}

	/** Reactive read-only view intended for editor UI rendering. */
	get document(): Readonly<EditorState> {
		return this.#document;
	}

	get selectedId(): string | null {
		return this.#selectedId;
	}

	get selectedNode(): NodeRef | null {
		return this.#selectedId === null ? null : findNode(this.#document, this.#selectedId);
	}

	get canUndo(): boolean {
		return this.#history.canUndo;
	}

	get canRedo(): boolean {
		return this.#history.canRedo;
	}

	/** Increments after every document mutation; useful for reactive consumers. */
	get revision(): number {
		return this.#revision;
	}

	get hostParameters(): readonly ParameterDef[] {
		return this.#hostParameters;
	}

	get parameters(): ParameterDef[] {
		return mergeParams(this.#document.settings.parameters, this.#hostParameters);
	}

	getState(): EditorState {
		return structuredClone($state.snapshot(this.#document) as EditorState);
	}

	subscribe(listener: EditorChangeListener): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	replaceState(state: EditorState): void {
		this.#document = structuredClone(state);
		this.#selectedId = null;
		this.#persistHostParameters();
		this.#history.clear();
		this.#history.capture(this.getState());
		this.#emit('replace');
	}

	importTemplate(json: string): TemplateParseResult {
		const result = parseTemplateFile(json, { registry: this.registry });
		if (result.ok) {
			this.#document = structuredClone(result.value.state);
			this.#selectedId = null;
			this.#persistHostParameters();
			this.#history.clear();
			this.#history.capture(this.getState());
			this.#emit('import');
		}
		return result;
	}

	setHostParameters(parameters: ParameterDef[]): void {
		this.#hostParameters = structuredClone(parameters);
		if (this.#persistHostParameters()) this.#commit('command');
	}

	select(id: string | null): void {
		this.#selectedId = id;
	}

	addSection(columns = 1): Section {
		const section = insertSection(this.#document, createSection(columns));
		this.#selectedId = section.id;
		this.#commit('command');
		return section;
	}

	addBlock(type: string): Block {
		let column = targetColumn(this.#document, this.#selectedId);
		if (!column) {
			this.#document.body.push(createSection(1));
			column = this.#document.body[this.#document.body.length - 1].columns[0];
		}
		const block = createBlock(type as BlockType, this.registry);
		column.blocks.push(block);
		this.#selectedId = block.id;
		this.#commit('command');
		return block;
	}

	remove(id: string): EditorCommandResult {
		const ok = removeNode(this.#document, id);
		if (ok) {
			this.#selectedId = null;
			this.#commit('command');
		}
		return { ok };
	}

	duplicate(id: string): EditorCommandResult {
		const node = findNode(this.#document, id);
		if (!node) return { ok: false };
		const clone = node.kind === 'section' ? duplicateSection(this.#document, id) : duplicateBlock(this.#document, id);
		if (clone) {
			this.#selectedId = clone.id;
			this.#commit('command');
		}
		return { ok: Boolean(clone) };
	}

	moveSection(id: string, offset: -1 | 1): EditorCommandResult {
		const ok = moveSection(this.#document, id, offset);
		if (ok) this.#commit('command');
		return { ok };
	}

	replaceSections(sections: Section[]): void {
		this.#document.body = sections;
		this.#commit('command');
	}

	setColumnBlocks(columnId: string, blocks: Block[]): EditorCommandResult {
		const node = findNode(this.#document, columnId);
		if (node?.kind !== 'column') return { ok: false };
		node.column.blocks = blocks;
		this.#commit('command');
		return { ok: true };
	}

	addColumn(sectionId: string): EditorCommandResult {
		const column = addColumn(this.#document, sectionId);
		if (column) {
			this.#selectedId = column.id;
			this.#commit('command');
		}
		return { ok: Boolean(column) };
	}

	removeColumn(columnId: string): EditorCommandResult {
		const ok = removeColumn(this.#document, columnId);
		if (ok) {
			this.#selectedId = null;
			this.#commit('command');
		}
		return { ok };
	}

	setColumnWidth(columnId: string, percent: number): EditorCommandResult {
		const node = findNode(this.#document, columnId);
		if (node?.kind !== 'column') return { ok: false };
		const ok = setColumnWidth(node.section, columnId, percent);
		if (ok) this.#commit('command');
		return { ok };
	}

	setField(nodeId: string | null, key: string, value: unknown): EditorCommandResult {
		const target = nodeId === null
			? (this.#document.settings as unknown as Record<string, unknown>)
			: this.#propsForNode(nodeId);
		if (!target) return { ok: false };
		target[key] = structuredClone(value);
		this.#commit('command');
		return { ok: true };
	}

	setTextContent(blockId: string, html: string): EditorCommandResult {
		return this.setField(blockId, 'content', sanitizeTextHtml(html));
	}

	setTracking(tracking: TrackingSettings): void {
		this.#document.settings.tracking = structuredClone(tracking);
		this.#commit('command');
	}

	createParameter(key: string, label?: string): ParameterDef | null {
		const normalized = key.trim();
		if (!isValidParameterKey(normalized)) return null;
		const existing = this.parameters.find((parameter) => parameter.key === normalized);
		if (existing) return existing;
		const created: ParameterDef = { key: normalized, label: label?.trim() || normalized };
		this.#document.settings.parameters = [...(this.#document.settings.parameters ?? []), created];
		this.#commit('command');
		return created;
	}

	setParameters(parameters: ParameterDef[]): void {
		this.#document.settings.parameters = structuredClone(parameters);
		this.#commit('command');
	}

	undo(): EditorCommandResult {
		return this.#restore(this.#history.undo(), 'undo');
	}

	redo(): EditorCommandResult {
		return this.#restore(this.#history.redo(), 'redo');
	}

	exportTemplate(): TemplateFile {
		const file = createTemplateFile(this.getState());
		this.#onTemplateExport?.(file);
		return file;
	}

	async exportDelivery(): Promise<EmailExport> {
		const exported = await exportEmail(this.getState(), { registry: this.registry });
		this.#onDeliveryExport?.(exported);
		return exported;
	}

	get hasTemplateExportHandler(): boolean {
		return Boolean(this.#onTemplateExport);
	}

	get hasDeliveryExportHandler(): boolean {
		return Boolean(this.#onDeliveryExport);
	}

	#propsForNode(id: string): Record<string, unknown> | null {
		const node = findNode(this.#document, id);
		if (!node) return null;
		return (node.kind === 'section'
			? node.section.props
			: node.kind === 'column'
				? node.column.props
				: node.block.props) as unknown as Record<string, unknown>;
	}

	#persistHostParameters(): boolean {
		if (!this.persistParameters) return false;
		const merged = mergeParams(this.#document.settings.parameters, this.#hostParameters);
		if (JSON.stringify(this.#document.settings.parameters ?? []) === JSON.stringify(merged)) return false;
		this.#document.settings.parameters = structuredClone(merged);
		return true;
	}

	#restore(snapshot: EditorState | null, source: 'undo' | 'redo'): EditorCommandResult {
		if (!snapshot) return { ok: false };
		this.#document = structuredClone(snapshot);
		this.#selectedId = null;
		this.#emit(source);
		return { ok: true };
	}

	#commit(source: EditorChangeSource): void {
		this.#history.capture(this.getState());
		this.#emit(source);
	}

	#emit(source: EditorChangeSource): void {
		this.#revision++;
		const change: EditorChange = { source, state: this.getState() };
		for (const listener of this.#listeners) listener(change);
	}
}

/** Create a controller-owned editor session for one mounted `MjmlEditor`. */
export function createEditor(options: EditorOptions): EditorController {
	return new EditorController(options);
}
