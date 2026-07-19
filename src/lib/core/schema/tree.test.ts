import { describe, expect, it } from 'vitest';
import { createBlock, createEmptyState, createSection } from './defaults.js';
import {
	MAX_COLUMNS,
	addColumn,
	cloneWithNewIds,
	duplicateBlock,
	duplicateSection,
	insertSection,
	moveBlock,
	moveSection,
	removeColumn,
	removeNode
} from './tree.js';
import type { EditorState } from './types.js';

/** Two sections: [0] one column with two blocks, [1] two columns with one block each. */
function fixture(): EditorState {
	const state = createEmptyState();
	const one = createSection(1);
	one.columns[0].blocks.push(createBlock('text'), createBlock('button'));
	const two = createSection(2);
	two.columns[0].blocks.push(createBlock('image'));
	two.columns[1].blocks.push(createBlock('divider'));
	state.body = [one, two];
	return state;
}

function allIds(state: EditorState): string[] {
	return state.body.flatMap((s) => [
		s.id,
		...s.columns.flatMap((c) => [c.id, ...c.blocks.map((b) => b.id)])
	]);
}

describe('cloneWithNewIds', () => {
	it('clones deeply with fresh ids on every node', () => {
		const section = fixture().body[1];
		const clone = cloneWithNewIds(section);
		expect(clone.columns).toHaveLength(2);
		expect(clone.columns[0].blocks[0].type).toBe('image');
		const originalIds = [section.id, ...section.columns.map((c) => c.id)];
		const cloneIds = [clone.id, ...clone.columns.map((c) => c.id)];
		for (const id of cloneIds) expect(originalIds).not.toContain(id);
	});
});

describe('sections', () => {
	it('insertSection inserts at index (end by default)', () => {
		const state = fixture();
		const s = insertSection(state, createSection(1), 0);
		expect(state.body[0]).toBe(s);
		expect(state.body).toHaveLength(3);
	});

	it('moveSection swaps neighbours and rejects out-of-range moves', () => {
		const state = fixture();
		const [first, second] = state.body;
		expect(moveSection(state, first.id, -1)).toBe(false);
		expect(moveSection(state, first.id, 1)).toBe(true);
		expect(state.body[0]).toBe(second);
		expect(moveSection(state, first.id, 1)).toBe(false);
	});

	it('duplicateSection clones after the original with fresh ids', () => {
		const state = fixture();
		const clone = duplicateSection(state, state.body[0].id);
		expect(clone).not.toBeNull();
		expect(state.body[1]).toBe(clone);
		expect(new Set(allIds(state)).size).toBe(allIds(state).length);
	});
});

describe('columns', () => {
	it('addColumn appends and clears explicit widths', () => {
		const state = fixture();
		const section = state.body[1];
		section.columns[0].props.width = '70%';
		const column = addColumn(state, section.id);
		expect(column).not.toBeNull();
		expect(section.columns).toHaveLength(3);
		expect(section.columns[0].props.width).toBeUndefined();
	});

	it('addColumn refuses beyond MAX_COLUMNS', () => {
		const state = fixture();
		const section = state.body[1];
		while (section.columns.length < MAX_COLUMNS) addColumn(state, section.id);
		expect(addColumn(state, section.id)).toBeNull();
		expect(section.columns).toHaveLength(MAX_COLUMNS);
	});

	it('removeColumn re-homes blocks into the previous sibling', () => {
		const state = fixture();
		const section = state.body[1];
		const removedBlock = section.columns[1].blocks[0];
		expect(removeColumn(state, section.columns[1].id)).toBe(true);
		expect(section.columns).toHaveLength(1);
		expect(section.columns[0].blocks).toContain(removedBlock);
	});

	it('removeColumn refuses the last column (also via removeNode)', () => {
		const state = fixture();
		const section = state.body[0];
		expect(removeColumn(state, section.columns[0].id)).toBe(false);
		expect(removeNode(state, section.columns[0].id)).toBe(false);
		expect(section.columns).toHaveLength(1);
	});
});

describe('blocks', () => {
	it('duplicateBlock clones right after the original with a fresh id', () => {
		const state = fixture();
		const column = state.body[0].columns[0];
		const original = column.blocks[0];
		const clone = duplicateBlock(state, original.id);
		expect(clone).not.toBeNull();
		expect(column.blocks).toHaveLength(3);
		expect(column.blocks[1]).toBe(clone);
		expect(clone!.id).not.toBe(original.id);
		expect(clone!.type).toBe(original.type);
	});

	it('moveBlock moves across columns (end by default, index honoured)', () => {
		const state = fixture();
		const block = state.body[0].columns[0].blocks[0];
		const target = state.body[1].columns[1];
		expect(moveBlock(state, block.id, target.id)).toBe(true);
		expect(state.body[0].columns[0].blocks).toHaveLength(1);
		expect(target.blocks[target.blocks.length - 1]).toBe(block);

		const back = state.body[0].columns[0];
		expect(moveBlock(state, block.id, back.id, 0)).toBe(true);
		expect(back.blocks[0]).toBe(block);
	});

	it('removeNode removes sections and blocks by id', () => {
		const state = fixture();
		const block = state.body[0].columns[0].blocks[0];
		expect(removeNode(state, block.id)).toBe(true);
		expect(removeNode(state, state.body[1].id)).toBe(true);
		expect(state.body).toHaveLength(1);
		expect(removeNode(state, 'missing')).toBe(false);
	});
});
