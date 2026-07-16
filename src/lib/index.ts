// Editor UI
export { default as MjmlEditor } from './ui/MjmlEditor.svelte';
export { type ThemeTokens } from './ui/theme.js';

// Core (headless) API — safe to import in any environment.
// compile() lazy-loads mjml-browser, so only calling it requires a DOM.
export { compile, type CompileResult } from './core/compiler/compile.js';
export { serializeToMjml } from './core/serializer/serializeToMjml.js';
export { builtinBlocks } from './core/registry/builtins.js';
export {
	createRegistry,
	defaultRegistry,
	type AnyBlockDefinition,
	type BlockRegistry
} from './core/registry/registry.js';
export {
	defineBlock,
	type BlockDefinition,
	type InspectorControl,
	type InspectorField
} from './core/registry/types.js';
export {
	SCHEMA_VERSION,
	createBlock,
	createColumn,
	createDefaultSettings,
	createEmptyState,
	createSection,
	newId
} from './core/schema/defaults.js';
export type {
	Align,
	Block,
	BlockType,
	ButtonBlock,
	ButtonBlockProps,
	Column,
	ColumnProps,
	DividerBlock,
	DividerBlockProps,
	DocumentSettings,
	EditorState,
	ImageBlock,
	ImageBlockProps,
	Padding,
	Section,
	SectionProps,
	SocialBlock,
	SocialBlockProps,
	SocialElement,
	SocialNetwork,
	SpacerBlock,
	SpacerBlockProps,
	TextBlock,
	TextBlockProps
} from './core/schema/types.js';
