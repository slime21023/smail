import { defaultRegistry, type BlockRegistry } from '../registry/registry.js';
import type { Block, BlockType, Column, DocumentSettings, EditorState, Section } from './types.js';

export const SCHEMA_VERSION = '0.1';

export function newId(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultSettings(): DocumentSettings {
	return {
		width: 600,
		backgroundColor: '#f4f4f4',
		fontFamily: 'Arial, sans-serif',
		textColor: '#333333',
		linkColor: '#2563eb'
	};
}

export function createEmptyState(): EditorState {
	return {
		version: SCHEMA_VERSION,
		settings: createDefaultSettings(),
		body: []
	};
}

export function createColumn(partial: Partial<Column['props']> = {}): Column {
	return {
		id: newId(),
		type: 'column',
		props: { verticalAlign: 'top', ...partial },
		blocks: []
	};
}

export function createSection(columnCount = 1): Section {
	return {
		id: newId(),
		type: 'section',
		props: { padding: { top: 20, right: 0, bottom: 20, left: 0 } },
		columns: Array.from({ length: columnCount }, () => createColumn())
	};
}

/** Create a block of `type` with the registry's default props (deep-cloned). */
export function createBlock<T extends BlockType>(
	type: T,
	registry: BlockRegistry = defaultRegistry
): Extract<Block, { type: T }> {
	const def = registry.get(type);
	if (!def) throw new Error(`Unknown block type: ${type}`);
	return {
		id: newId(),
		type,
		props: structuredClone(def.defaultProps)
	} as Extract<Block, { type: T }>;
}
