import { getContext, setContext } from 'svelte';
import { DEFAULT_DELIMITERS, type ParamDelimiters } from '../core/params/params.js';
import type { ParameterDef } from '../core/schema/types.js';

/** Editor-level services reachable from any control depth without prop-drilling. */
export interface EditorContext {
	readonly onImageUpload?: (file: File) => Promise<string>;
	readonly parameters: ParameterDef[];
	readonly delimiters: ParamDelimiters;
}

export const EDITOR_CTX = Symbol('smail-editor');

const FALLBACK: EditorContext = { parameters: [], delimiters: DEFAULT_DELIMITERS };

export function setEditorContext(ctx: EditorContext): void {
	setContext(EDITOR_CTX, ctx);
}

/** Safe outside an editor tree (standalone mounts, tests) — returns inert defaults. */
export function getEditorContext(): EditorContext {
	return getContext<EditorContext | undefined>(EDITOR_CTX) ?? FALLBACK;
}
