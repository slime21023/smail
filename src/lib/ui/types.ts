import type { EditorController } from '../controller/editor.svelte.js';
import type { ThemeTokens } from './theme.js';

/** Props for the controller-first Svelte editor view. */
export interface MjmlEditorProps {
	/** Controller created with `createEditor`; it owns document state and extensions. */
	editor: EditorController;
	/** Hides end-user mutation controls while retaining preview and export actions. */
	readonly?: boolean;
	/** Visual tokens applied only to this editor view. */
	theme?: ThemeTokens;
}
