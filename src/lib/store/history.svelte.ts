import type { EditorState } from '../core/schema/types.js';

interface HistoryEntry {
	/** Dedup key — the serialized MJML of the snapshot. */
	key: string;
	state: EditorState;
}

/**
 * Snapshot-based undo/redo. Callers capture a plain snapshot (use
 * `$state.snapshot`) keyed by its serialized MJML; identical consecutive
 * keys are dropped, which also keeps undo/redo application from
 * re-recording itself (restoring a state re-captures the same key).
 *
 * Stacks are `$state.raw` and updated immutably so stored snapshots stay
 * plain objects (deep proxies cannot be structuredClone'd).
 */
export class HistoryStore {
	#past = $state.raw<HistoryEntry[]>([]);
	#future = $state.raw<HistoryEntry[]>([]);
	readonly limit: number;

	constructor(limit = 50) {
		this.limit = limit;
	}

	/** The first entry is the baseline, so undo needs at least two. */
	get canUndo(): boolean {
		return this.#past.length > 1;
	}

	get canRedo(): boolean {
		return this.#future.length > 0;
	}

	capture(key: string, snapshot: EditorState): void {
		const last = this.#past[this.#past.length - 1];
		if (last?.key === key) return;
		this.#past = [...this.#past, { key, state: snapshot }].slice(-this.limit);
		this.#future = [];
	}

	/** Returns the state to restore, or null when at the baseline. */
	undo(): EditorState | null {
		if (!this.canUndo) return null;
		const current = this.#past[this.#past.length - 1];
		this.#past = this.#past.slice(0, -1);
		this.#future = [...this.#future, current];
		return structuredClone(this.#past[this.#past.length - 1].state);
	}

	redo(): EditorState | null {
		const entry = this.#future[this.#future.length - 1];
		if (!entry) return null;
		this.#future = this.#future.slice(0, -1);
		this.#past = [...this.#past, entry];
		return structuredClone(entry.state);
	}
}
