/** Lightweight documentation contract check; intentionally has no npm dependency. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const docsRoutes = resolve(root, 'docs/src/routes');
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const markdownFiles = walk(root).filter((file) => extname(file) === '.md');
const failures = [];

for (const file of markdownFiles) {
	const content = readFileSync(file, 'utf8');
	for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
		const href = match[1].replace(/^<|>$/g, '');
		if (!href || href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
		const path = href.split('#', 1)[0];
		if (!existsSync(resolve(dirname(file), path))) {
			failures.push(`${relative(file)}: broken relative link ${href}`);
		}
	}
	for (const match of content.matchAll(/\bbun run ([\w:-]+)/g)) {
		if (!(match[1] in packageJson.scripts)) {
			failures.push(`${relative(file)}: no package script named ${match[1]}`);
		}
	}
	if (file.startsWith(docsRoutes)) {
		for (const match of content.matchAll(/<Link\s+to="([^"]+)"/g)) {
			const target = match[1];
			if (target.startsWith('/') && !existsSync(routeToFile(target))) {
				failures.push(`${relative(file)}: documentation link target ${target} has no route`);
			}
		}
	}
}

const publicApi = readFileSync(resolve(root, 'src/lib/index.ts'), 'utf8');
const apiReference = readFileSync(resolve(docsRoutes, 'reference/api/+page.md'), 'utf8');
const controllerGuide = readFileSync(resolve(docsRoutes, 'guides/editor-controller/+page.md'), 'utf8');
for (const heading of [
	'## Component APIs',
	'### `MjmlEditor`',
	'### Custom Inspector control component',
	'### Custom text editor component',
	'### `EditorOptions`'
]) {
	if (!apiReference.includes(heading)) {
		failures.push(`docs/src/routes/reference/api/+page.md: missing component API section ${heading}`);
	}
}
for (const name of [
	'MjmlEditor',
	'MjmlEditorProps',
	'ThemeTokens',
	'createEditor',
	'EditorController',
	'EditorChange',
	'EditorChangeListener',
	'EditorChangeSource',
	'EditorCommandResult',
	'EditorOptions',
	'compile',
	'CompileResult',
	'serializeToMjml',
	'sanitizeTextHtml',
	'sanitizeEmailUrl',
	'EmailUrlKind',
	'BUILTIN_TEMPLATE_IDS',
	'createBuiltinTemplate',
	'BuiltinTemplateId',
	'createTemplateFile',
	'parseTemplateFile',
	'serializeTemplateFile',
	'migrateEditorState',
	'DEFAULT_TEMPLATE_MAX_BYTES',
	'TEMPLATE_FORMAT',
	'TEMPLATE_FORMAT_VERSION',
	'ParseTemplateOptions',
	'TemplateFile',
	'TemplateParseResult',
	'TemplateValidationIssue',
	'exportEmail',
	'mergeTracking',
	'rewriteLinksForUtm',
	'EmailExport',
	'EmailExportOverrides',
	'builtinBlocks',
	'defineBlock',
	'BlockDefinition',
	'AnyBlockDefinition',
	'BlockRegistry',
	'createRegistry',
	'defaultRegistry',
	'BuiltinInspectorControl',
	'ControlProps',
	'ControlRegistry',
	'InspectorControl',
	'InspectorField',
	'SelectOption',
	'TextEditorProps',
	'normalizeOptions',
	'DEFAULT_DELIMITERS',
	'extractParams',
	'isValidParameterKey',
	'mergeParams',
	'substituteParams',
	'ParamDelimiters',
	'ParameterDef',
	'columnFields',
	'sectionFields',
	'settingsFields',
	'StructuralFields',
	'SOCIAL_NETWORKS',
	'SCHEMA_VERSION',
	'createBlock',
	'createColumn',
	'createDefaultSettings',
	'createDefaultTrackingSettings',
	'createEmptyState',
	'createSection',
	'newId',
	'MAX_COLUMNS',
	'COLUMN_WIDTH_STEP',
	'MIN_COLUMN_WIDTH',
	'addColumn',
	'cloneWithNewIds',
	'duplicateBlock',
	'duplicateSection',
	'findNode',
	'insertSection',
	'moveBlock',
	'moveSection',
	'normalizeColumnWidths',
	'removeColumn',
	'removeNode',
	'resolveColumnWidths',
	'setColumnWidth',
	'targetColumn',
	'NodeRef',
	'Align',
	'Block',
	'BlockType',
	'ButtonBlock',
	'ButtonBlockProps',
	'Column',
	'ColumnProps',
	'DividerBlock',
	'DividerBlockProps',
	'DocumentSettings',
	'EditorState',
	'ImageBlock',
	'ImageBlockProps',
	'Padding',
	'Section',
	'SectionProps',
	'SocialBlock',
	'SocialBlockProps',
	'SocialElement',
	'SocialNetwork',
	'SpacerBlock',
	'SpacerBlockProps',
	'TextBlock',
	'TextBlockProps',
	'TrackingSettings',
	'UTMTrackingSettings'
]) {
	if (!publicApi.includes(name)) failures.push(`src/lib/index.ts: expected public export ${name} is absent`);
	if (!apiReference.includes(`\`${name}\``)) {
		failures.push(`docs/src/routes/reference/api/+page.md: missing public API entry ${name}`);
	}
}

for (const name of [
	'getState', 'subscribe', 'replaceState', 'importTemplate', 'setHostParameters',
	'select', 'addSection', 'addBlock', 'remove', 'duplicate', 'moveSection',
	'replaceSections', 'setColumnBlocks', 'addColumn', 'removeColumn',
	'setColumnWidth', 'setField', 'setTextContent', 'setTracking',
	'createParameter', 'setParameters', 'undo', 'redo', 'exportTemplate', 'exportDelivery'
]) {
	if (!new RegExp('`' + name + '(?:`|\\()').test(controllerGuide)) {
		failures.push(`docs/src/routes/guides/editor-controller/+page.md: missing controller method ${name}`);
	}
}

const expectedRoutes = [
	'/',
	'/guides/getting-started/',
	'/guides/editor-controller/',
	'/guides/persistence-and-delivery/',
	'/guides/customization/',
	'/reference/api/',
	'/reference/architecture/',
	'/operations/production-readiness/',
	'/operations/email-rendering-matrix/',
	'/operations/publishing/'
];

for (const route of expectedRoutes) {
	const file = routeToFile(route);
	if (!existsSync(file)) failures.push(`docs: missing route ${route}`);
	else if (!readFileSync(file, 'utf8').startsWith('---\n')) {
		failures.push(`${relative(file)}: route pages must declare frontmatter`);
	}
}

const viteConfig = readFileSync(resolve(root, 'docs/vite.config.ts'), 'utf8');
for (const match of viteConfig.matchAll(/\bto:\s*'([^']+)'/g)) {
	const target = match[1];
	if (target.startsWith('/') && !existsSync(routeToFile(target))) {
		failures.push(`docs/vite.config.ts: navigation target ${target} has no route`);
	}
}

if (failures.length) throw new Error(`Documentation check failed:\n${failures.join('\n')}`);
console.log(`Documentation check passed (${markdownFiles.length} Markdown files).`);

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		if (['node_modules', '.git', '.svelte-kit', 'dist', 'build', 'e2e-artifacts'].includes(entry.name)) return [];
		const full = resolve(directory, entry.name);
		return entry.isDirectory() ? walk(full) : [full];
	});
}

function relative(file) {
	return file.slice(root.length + 1).split('\\').join('/');
}

function routeToFile(route) {
	const segments = route.replace(/^\/+|\/+$/g, '');
	return resolve(docsRoutes, segments, '+page.md');
}
