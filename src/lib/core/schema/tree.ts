import type { Block, Column, EditorState, Section } from './types.js';

export type NodeRef =
	| { kind: 'section'; section: Section }
	| { kind: 'column'; section: Section; column: Column }
	| { kind: 'block'; section: Section; column: Column; block: Block };

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
