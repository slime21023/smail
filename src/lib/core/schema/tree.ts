import { createColumn, newId } from './defaults.js';
import type { Block, Column, EditorState, Section } from './types.js';

export type NodeRef =
	| { kind: 'section'; section: Section }
	| { kind: 'column'; section: Section; column: Column }
	| { kind: 'block'; section: Section; column: Column; block: Block };

/** Sections cap out at 4 columns (email layouts degrade beyond that). */
export const MAX_COLUMNS = 4;
export const COLUMN_WIDTH_STEP = 5;
export const MIN_COLUMN_WIDTH = 10;
const WIDTH_UNITS = 100 / COLUMN_WIDTH_STEP;
const MIN_WIDTH_UNITS = MIN_COLUMN_WIDTH / COLUMN_WIDTH_STEP;

/** Resolve any legacy or invalid widths into 5%-step percentages totaling 100. */
export function resolveColumnWidths(columns: readonly Column[]): number[] {
	if (columns.length === 0) return [];
	const minimumTotal = columns.length * MIN_WIDTH_UNITS;
	if (minimumTotal > WIDTH_UNITS) throw new Error(`Too many columns for a ${MIN_COLUMN_WIDTH}% minimum width.`);

	const parsed = columns.map((column) => parseWidth(column.props.width));
	const weights = parsed.every((width) => width !== null)
		? parsed.map((width) => Math.max(0, width! - MIN_COLUMN_WIDTH))
		: columns.map(() => 1);
	const extras = distributeUnits(WIDTH_UNITS - minimumTotal, weights);
	return extras.map((extra) => (extra + MIN_WIDTH_UNITS) * COLUMN_WIDTH_STEP);
}

/** Set one column's width and proportionally redistribute its siblings. */
export function setColumnWidth(section: Section, columnId: string, percent: number): boolean {
	const index = section.columns.findIndex((column) => column.id === columnId);
	if (index < 0) return false;
	const count = section.columns.length;
	if (count <= 1) {
		applyColumnWidths(section.columns, [100]);
		return true;
	}
	const maxUnits = WIDTH_UNITS - (count - 1) * MIN_WIDTH_UNITS;
	const requested = clamp(Math.round(percent / COLUMN_WIDTH_STEP), MIN_WIDTH_UNITS, maxUnits);
	const current = resolveColumnWidths(section.columns).map((width) => width / COLUMN_WIDTH_STEP);
	const siblingIndexes = current.map((_, siblingIndex) => siblingIndex).filter((siblingIndex) => siblingIndex !== index);
	const siblingWeights = siblingIndexes.map((siblingIndex) => Math.max(0, current[siblingIndex] - MIN_WIDTH_UNITS));
	const siblingExtras = distributeUnits(WIDTH_UNITS - requested - siblingIndexes.length * MIN_WIDTH_UNITS, siblingWeights);
	const next = current.map(() => MIN_WIDTH_UNITS);
	next[index] = requested;
	siblingIndexes.forEach((siblingIndex, siblingPosition) => {
		next[siblingIndex] += siblingExtras[siblingPosition];
	});
	applyColumnWidths(section.columns, next.map((units) => units * COLUMN_WIDTH_STEP));
	return true;
}

/** Mutate a section into its canonical 100%-total column layout. */
export function normalizeColumnWidths(section: Section): boolean {
	const resolved = resolveColumnWidths(section.columns);
	const changed = section.columns.some((column, index) => column.props.width !== `${resolved[index]}%`);
	applyColumnWidths(section.columns, resolved);
	return changed;
}

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
	applyColumnWidths(node.section.columns, equalWidths(node.section.columns.length));
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
	normalizeColumnWidths(section);
	return true;
}

function parseWidth(value: string | undefined): number | null {
	if (!value || !/^\d+(?:\.\d+)?%$/.test(value)) return null;
	const percent = Number.parseFloat(value);
	return Number.isFinite(percent) && percent > 0 ? percent : null;
}

function distributeUnits(total: number, weights: number[]): number[] {
	if (weights.length === 0) return [];
	const safeTotal = Math.max(0, total);
	const sum = weights.reduce((result, weight) => result + weight, 0);
	const source = sum > 0 ? weights : weights.map(() => 1);
	const sourceSum = source.reduce((result, weight) => result + weight, 0);
	const exact = source.map((weight) => (safeTotal * weight) / sourceSum);
	const distributed = exact.map(Math.floor);
	let remainder = safeTotal - distributed.reduce((result, value) => result + value, 0);
	const order = exact
		.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
		.sort((a, b) => b.fraction - a.fraction || a.index - b.index);
	for (const item of order) {
		if (remainder <= 0) break;
		distributed[item.index]++;
		remainder--;
	}
	return distributed;
}

function equalWidths(count: number): number[] {
	return resolveColumnWidths(Array.from({ length: count }, () => ({ props: {} } as Column)));
}

function applyColumnWidths(columns: readonly Column[], widths: readonly number[]) {
	columns.forEach((column, index) => {
		column.props.width = `${widths[index]}%`;
	});
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
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
