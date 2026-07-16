import { describe, expect, it } from 'vitest';
import { createEmptyState } from '../core/schema/defaults.js';
import type { EditorState } from '../core/schema/types.js';
import { HistoryStore } from './history.svelte.js';

function snap(preheader: string): EditorState {
	const state = createEmptyState();
	state.settings.preheader = preheader;
	return state;
}

describe('HistoryStore', () => {
	it('cannot undo past the baseline', () => {
		const history = new HistoryStore();
		history.capture('a', snap('a'));
		expect(history.canUndo).toBe(false);
		expect(history.undo()).toBeNull();
	});

	it('undoes to the previous snapshot and redoes forward', () => {
		const history = new HistoryStore();
		history.capture('a', snap('a'));
		history.capture('b', snap('b'));
		history.capture('c', snap('c'));

		expect(history.undo()?.settings.preheader).toBe('b');
		expect(history.undo()?.settings.preheader).toBe('a');
		expect(history.canUndo).toBe(false);
		expect(history.redo()?.settings.preheader).toBe('b');
		expect(history.redo()?.settings.preheader).toBe('c');
		expect(history.canRedo).toBe(false);
	});

	it('drops consecutive captures with the same key (undo re-capture)', () => {
		const history = new HistoryStore();
		history.capture('a', snap('a'));
		history.capture('b', snap('b'));
		history.undo();
		// Restoring 'a' re-serializes to the same key — must not clear redo.
		history.capture('a', snap('a'));
		expect(history.canRedo).toBe(true);
		expect(history.redo()?.settings.preheader).toBe('b');
	});

	it('a new edit after undo clears the redo stack', () => {
		const history = new HistoryStore();
		history.capture('a', snap('a'));
		history.capture('b', snap('b'));
		history.undo();
		history.capture('c', snap('c'));
		expect(history.canRedo).toBe(false);
	});

	it('evicts the oldest snapshot beyond the limit', () => {
		const history = new HistoryStore(3);
		history.capture('a', snap('a'));
		history.capture('b', snap('b'));
		history.capture('c', snap('c'));
		history.capture('d', snap('d'));

		expect(history.undo()?.settings.preheader).toBe('c');
		expect(history.undo()?.settings.preheader).toBe('b');
		// 'a' was evicted — 'b' is the new baseline.
		expect(history.undo()).toBeNull();
	});

	it('returned snapshots are isolated clones', () => {
		const history = new HistoryStore();
		history.capture('a', snap('a'));
		history.capture('b', snap('b'));
		const restored = history.undo()!;
		restored.settings.preheader = 'mutated';
		history.capture('x', snap('x'));
		expect(history.undo()?.settings.preheader).toBe('a');
	});
});
