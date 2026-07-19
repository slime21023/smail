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
	type BuiltinInspectorControl,
	type ControlProps,
	type ControlRegistry,
	type InspectorControl,
	type InspectorField,
	type SelectOption
} from './core/registry/types.js';
export { normalizeOptions } from './core/registry/options.js';
export {
	columnFields,
	sectionFields,
	settingsFields,
	type StructuralFields
} from './core/registry/structural.js';
export {
	SCHEMA_VERSION,
	createBlock,
	createColumn,
	createDefaultSettings,
	createEmptyState,
	createSection,
	newId
} from './core/schema/defaults.js';
export {
	MAX_COLUMNS,
	addColumn,
	cloneWithNewIds,
	duplicateBlock,
	duplicateSection,
	findNode,
	insertSection,
	moveBlock,
	moveSection,
	removeColumn,
	removeNode,
	targetColumn,
	type NodeRef
} from './core/schema/tree.js';
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
