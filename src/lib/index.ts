// Editor UI
export { default as MjmlEditor } from './ui/MjmlEditor.svelte';
export { type ThemeTokens } from './ui/theme.js';

// Core (headless) API — safe to import in any environment.
// compile() lazy-loads mjml-browser, so only calling it requires a DOM.
export { compile, type CompileResult } from './core/compiler/compile.js';
export { serializeToMjml } from './core/serializer/serializeToMjml.js';
export { sanitizeTextHtml } from './core/text/sanitize.js';
export { sanitizeEmailUrl, type EmailUrlKind } from './core/security/urls.js';
export {
	BUILTIN_TEMPLATE_IDS,
	createBuiltinTemplate,
	type BuiltinTemplateId
} from './templates/builtin.js';
export {
	createTemplateFile,
	migrateEditorState,
	parseTemplateFile,
	serializeTemplateFile,
	DEFAULT_TEMPLATE_MAX_BYTES,
	TEMPLATE_FORMAT,
	TEMPLATE_FORMAT_VERSION,
	type ParseTemplateOptions,
	type TemplateFile,
	type TemplateParseResult,
	type TemplateValidationIssue
} from './core/template/template.js';
export {
	exportEmail,
	mergeTracking,
	rewriteLinksForUtm,
	type EmailExport,
	type EmailExportOverrides
} from './core/template/exportEmail.js';
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
	type SelectOption,
	type TextEditorProps
} from './core/registry/types.js';
export { normalizeOptions } from './core/registry/options.js';
export {
	DEFAULT_DELIMITERS,
	extractParams,
	isValidParameterKey,
	mergeParams,
	substituteParams,
	type ParamDelimiters,
	type ParameterDef
} from './core/params/params.js';
export {
	columnFields,
	sectionFields,
	settingsFields,
	type StructuralFields
} from './core/registry/structural.js';
export { SOCIAL_NETWORKS } from './core/schema/types.js';
export {
	SCHEMA_VERSION,
	createBlock,
	createColumn,
	createDefaultSettings,
	createDefaultTrackingSettings,
	createEmptyState,
	createSection,
	newId
} from './core/schema/defaults.js';
export {
	MAX_COLUMNS,
	COLUMN_WIDTH_STEP,
	MIN_COLUMN_WIDTH,
	addColumn,
	cloneWithNewIds,
	duplicateBlock,
	duplicateSection,
	findNode,
	insertSection,
	moveBlock,
	moveSection,
	normalizeColumnWidths,
	removeColumn,
	removeNode,
	resolveColumnWidths,
	setColumnWidth,
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
	TextBlockProps,
	TrackingSettings,
	UTMTrackingSettings
} from './core/schema/types.js';
