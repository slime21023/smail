import { createColumn, newId } from './defaults.js';
import type { Block, Column, EditorState, Section } from './types.js';

export type NodeRef =
	| { kind: 'section'; section: Section }
	| { kind: 'column'; section: Section; column: Column }
	| { kind: 'block'; section: Section; column: Column; block: Block };

/** Sections cap out at 4 columns (email layouts degrade beyond that). */
export const MAX_COLUMNS = 4;

/** Locate a section, column, or block by id anywhere in the document tree. */
export function findNode(state: EditorState, id: string): NodeRef | null {
	for (const section of state.body) {
		if (section.id === id) return { kind: 'section', section };
		for (const column of section.columns) {
			if (column.id === id) return { kind: 'column', section, column };
			for (const block of column.blocks) {
				if (block.id === id) return { kind: 'block', section, column, block };
			}
		}
	}
	return null;
}

/** The column a new block should land in for the current selection, if any. */
export function targetColumn(state: EditorState, selectedId: string | null): Column | null {
	if (selectedId) {
		const node = findNode(state, selectedId);
		if (node?.kind === 'column' || node?.kind === 'block') return node.column;
		if (node?.kind === 'section') return node.section.columns[0] ?? null;
	}
	const lastSection = state.body[state.body.length - 1];
	return lastSection?.columns[0] ?? null;
}

/**
 * Deep-clone a subtree with fresh ids on every node. JSON-based so it accepts
 * both plain state and Svelte reactive proxies (the schema is JSON by design).
 */
export function cloneWithNewIds<T extends Section | Column | Block>(node: T): T {
	const clone = JSON.parse(JSON.stringify(node)) as T;
	reassignIds(clone);
	return clone;
}

function reassignIds(node: Section | Column | Block) {
	node.id = newId();
	if ('columns' in node) node.columns.forEach(reassignIds);
	if ('blocks' in node) node.blocks.forEach(reassignIds);
}

/**
 * Remove a section, column, or block by id. Column removal follows
 * `removeColumn` semantics (refuses the last column, re-homes blocks).
 */
export function removeNode(state: EditorState, id: string): boolean {
	const node = findNode(state, id);
	if (!node) return false;
	if (node.kind === 'section') {
		state.body.splice(state.body.indexOf(node.section), 1);
		return true;
	}
	if (node.kind === 'column') return removeColumn(state, id);
	node.column.blocks.splice(node.column.blocks.indexOf(node.block), 1);
	return true;
}

export function insertSection(state: EditorState, section: Section, index?: number): Section {
	state.body.splice(index ?? state.body.length, 0, section);
	return section;
}

/** Move a section one step up (-1) or down (+1). */
export function moveSection(state: EditorState, sectionId: string, offset: -1 | 1): boolean {
	const from = state.body.findIndex((s) => s.id === sectionId);
	const to = from + offset;
	if (from < 0 || to < 0 || to >= state.body.length) return false;
	const [section] = state.body.splice(from, 1);
	state.body.splice(to, 0, section);
	return true;
}

/** Clone a section (fresh ids) and insert it right after the original. */
export function duplicateSection(state: EditorState, sectionId: string): Section | null {
	const index = state.body.findIndex((s) => s.id === sectionId);
	if (index < 0) return null;
	const clone = cloneWithNewIds(state.body[index]);
	state.body.splice(index + 1, 0, clone);
	return clone;
}

/**
 * Append (or insert) an empty column. Returns null at the MAX_COLUMNS cap.
 * Explicit sibling widths are cleared so the new layout splits evenly.
 */
export function addColumn(state: EditorState, sectionId: string, index?: number): Column | null {
	const node = findNode(state, sectionId);
	if (node?.kind !== 'section') return null;
	if (node.section.columns.length >= MAX_COLUMNS) return null;
	const column = createColumn();
	node.section.columns.splice(index ?? node.section.columns.length, 0, column);
	for (const sibling of node.section.columns) delete sibling.props.width;
	return column;
}

/**
 * Remove a column, re-homing its blocks into the previous (or next) sibling
 * so content is never silently lost. Refuses to remove the last column.
 */
export function removeColumn(state: EditorState, columnId: string): boolean {
	const node = findNode(state, columnId);
	if (node?.kind !== 'column') return false;
	const { section, column } = node;
	if (section.columns.length <= 1) return false;
	const index = section.columns.indexOf(column);
	const neighbor = section.columns[index - 1] ?? section.columns[index + 1];
	neighbor.blocks.push(...column.blocks);
	section.columns.splice(index, 1);
	for (const sibling of section.columns) delete sibling.props.width;
	return true;
}

/** Clone a block (fresh id) and insert it right after the original. */
export function duplicateBlock(state: EditorState, blockId: string): Block | null {
	const node = findNode(state, blockId);
	if (node?.kind !== 'block') return null;
	const clone = cloneWithNewIds(node.block);
	node.column.blocks.splice(node.column.blocks.indexOf(node.block) + 1, 0, clone);
	return clone;
}

/**
 * Move a block into `targetColumnId` at `index` (end when omitted). The index
 * refers to the target column after the block has left its source column.
 */
export function moveBlock(
	state: EditorState,
	blockId: string,
	targetColumnId: string,
	index?: number
): boolean {
	const node = findNode(state, blockId);
	const target = findNode(state, targetColumnId);
	if (node?.kind !== 'block' || target?.kind !== 'column') return false;
	node.column.blocks.splice(node.column.blocks.indexOf(node.block), 1);
	target.column.blocks.splice(index ?? target.column.blocks.length, 0, node.block);
	return true;
}
