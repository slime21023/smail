---
title: API reference
description: Complete reference for smail public exports.
sidebarTitle: API reference
order: 1
---

All APIs below are exported from `smail`. Functions marked **mutates** change the supplied state or section in place; all other helpers return new data or derived output.

## Find an API

| If you need to… | Use |
| --- | --- |
| Mount the visual editor | `MjmlEditor` and `MjmlEditorProps` |
| Own an editing session or invoke commands | `createEditor` and `EditorController` |
| Build a custom Inspector field | `ControlProps` and `ControlRegistry` |
| Replace the Inspector rich-text editor | `TextEditorProps` |
| Save editable JSON or create HTML/MJML | Template persistence and Compilation and delivery |
| Register block definitions or structural fields | Blocks and registries |

Only `MjmlEditor` is a public smail UI component. Canvas, Toolbar, Inspector, Preview, and built-in block views are implementation details and must not be imported or controlled directly.

## Component APIs

### `MjmlEditor`

```svelte
<script lang="ts">
	import { MjmlEditor, createEditor, createEmptyState } from 'smail';

	const editor = createEditor({ state: createEmptyState() });
</script>

<MjmlEditor {editor} readonly={false} theme={{ accent: '#2563eb' }} />
```

| Prop | Type | Required | Contract |
| --- | --- | --- | --- |
| `editor` | `EditorController` | Yes | The controller owns the live draft, history, extensions, and callbacks. Keep the same instance for one mounted editing session. |
| `readonly` | `boolean` | No | Defaults to `false`. Hides mutation UI and template import; preview and export remain available. |
| `theme` | `ThemeTokens` | No | Editor-view CSS-token overrides. Each key becomes `--sme-<key>` on the component root. |

`MjmlEditor` does not expose `bind:state`, editing callbacks, or extension props. Configure those through `createEditor`. Rendering and preview compilation require a browser-like DOM; create the controller and work with its state APIs safely during SSR.

### Custom Inspector control component

Pass either `component` on an `InspectorField` or register a named Svelte component in `createEditor({ controls })`.

```svelte
<script lang="ts">
	import type { ControlProps } from 'smail';

	let { field, value, setValue }: ControlProps = $props();
</script>

<label>
	{field.label}
	<input value={String(value ?? '')} oninput={(event) => setValue(event.currentTarget.value)} />
</label>
```

| Prop | Type | Contract |
| --- | --- | --- |
| `field` | `InspectorField` | Metadata for the configured field, including its label, limits, options, and optional formatting/parsing functions. |
| `value` | `unknown` | Current stored value after smail applies the field’s `format`, if provided. |
| `setValue` | `(value: unknown) => void` | Commits the edited value through the controller after smail applies the field’s `parse`, if provided. Do not mutate controller state directly. |

### Custom text editor component

Pass `textEditor: YourComponent` to `createEditor` to replace only the Inspector Text-content editor. Canvas double-click editing remains smail’s built-in experience.

| Prop | Type | Contract |
| --- | --- | --- |
| `value` | `string` | Current Text block HTML. |
| `setValue` | `(html: string) => void` | Writes Text block HTML. smail sanitizes it before persistence. |
| `disabled` | `boolean` | Respect this in readonly or unavailable editing states. |
| `parameters` | `ParameterDef[]` | Effective merge-field list: persisted values plus protected host parameters. |
| `delimiters` | `ParamDelimiters` | Placeholder open/close strings used for insertion. |
| `createParameter` | `(key, label?) => ParameterDef \| null` | Creates and persists a valid user parameter, or returns an existing parameter. Returns `null` for an invalid key. |

The component exchanges HTML strings with smail; it owns any third-party editor model and dependency. It must call `setValue` for changes rather than writing to a block object.

### `ThemeTokens`

`ThemeTokens` is `Record<string, string>`. It is limited to the current `MjmlEditor` root, so multiple editor instances can use different themes. For example, `theme={{ 'panel-bg': '#f8fafc', radius: '10px' }}` produces `--sme-panel-bg` and `--sme-radius`.

## Editor session API

| Export | Contract |
|---|---|
| `createEditor` | `createEditor(options): EditorController`. Creates one controller-owned editing session. State operations are SSR-safe; rendering and delivery compilation need a browser-like DOM. |
| `EditorOptions` | Initial `state` plus blocks, controls, text editor, structural fields, parameters, delimiters, image upload, persistence behavior, and change/export handlers. Extensions are shared by editor import and delivery export. |
| `EditorController` | Owns the reactive editing draft, registry, history, selection, commands, import/export, and subscriptions. Use `getState()` for an isolated clone; do not mutate `document` directly. The <Link to="/guides/editor-controller/" label="Editor controller guide" /> provides lifecycle examples. |
| `EditorChange` | `{ source, state }` immutable notification payload. Sources are `command`, `undo`, `redo`, `import`, and `replace`. |
| `EditorChangeListener` | `(change: EditorChange) => void`, used by `onChange` and `subscribe`. |
| `EditorChangeSource` | Union of controller change source names. |
| `EditorCommandResult` | `{ ok: boolean }` returned by commands rejected by tree rules, such as removing the final column. |
| `MjmlEditor` | Public Svelte component described in Component APIs above. |
| `MjmlEditorProps` | Public prop interface described in Component APIs above. |
| `ThemeTokens` | Editor-view token type described in Component APIs above. |

### `EditorOptions`

| Option | Type | Contract |
| --- | --- | --- |
| `state` | `EditorState` | Required initial editable state. The controller clones it. |
| `blocks` | `AnyBlockDefinition[]` | Trusted custom blocks added to the registry used for editing, import, and delivery export. |
| `controls` / `textEditor` | `ControlRegistry` / `Component<TextEditorProps>` | Inspector extension components. |
| `structuralFields` | `StructuralFields` | Replaces default document, section, or column Inspector field lists. |
| `parameters` / `paramDelimiters` | `ParameterDef[]` / `ParamDelimiters` | Protected host merge fields and their placeholder syntax. |
| `persistParameters` | `boolean` | Defaults to `true`; controls whether host parameters are copied into saved settings. |
| `onImageUpload` | `(file: File) => Promise<string>` | Browser upload hook. The host validates authorization, files, and returned URLs. |
| `onChange` | `EditorChangeListener` | Receives a cloned snapshot for each document change. |
| `onTemplateExport` / `onDeliveryExport` | callbacks | Receive explicit controller export results; they do not provide storage or transport. |

### `EditorController` methods

| Area | Methods and behavior |
| --- | --- |
| State and events | `getState()` returns an isolated clone. `replaceState(state)` starts a new history baseline. `subscribe(listener)` returns an unsubscribe function; notifications carry cloned state and `command`, `undo`, `redo`, `import`, or `replace` sources. |
| Template I/O | `importTemplate(json)` returns `TemplateParseResult` and preserves the active document on failure. `exportTemplate()` creates a `TemplateFile`; `exportDelivery()` asynchronously creates `EmailExport` with the controller registry. |
| Selection | `select(id)`, `selectedId`, and `selectedNode`. Selection alone does not emit a document change. |
| Structure | `addSection`, `addBlock`, `remove`, `duplicate`, `moveSection`, `replaceSections`, `setColumnBlocks`, `addColumn`, and `removeColumn`. Rejected tree operations return `EditorCommandResult` with `ok: false`. |
| Layout and fields | `setColumnWidth` proportionally normalizes sibling widths. `setField`, `setTextContent`, and `setTracking` commit document values; text is sanitized. |
| Parameters | `parameters` merges persisted and host values. `createParameter`, `setParameters`, and `setHostParameters` manage the two sources; host entries win by key. |
| History | `undo()`, `redo()`, `canUndo`, and `canRedo`. Restored changes emit `undo` or `redo`. |

`onTemplateExport(file)` receives a versioned `TemplateFile`; `onDeliveryExport(output)` receives fresh delivery output. The 0.1 `onExport(html, json)` prop was removed in 1.0. See <Link to="/guides/editor-controller/" label="Editor controller" /> for task-oriented examples and SSR boundaries.

## Compilation and delivery

| Export | Signature and behavior |
|---|---|
| `compile` | `compile(mjml): Promise<CompileResult>`. Lazy-loads `mjml-browser`, requires a browser-like DOM when called, uses soft MJML validation, and caches equal input. |
| `CompileResult` | `{ html: string; errors: MjmlError[] }`. Compile errors are returned, not thrown by normal soft validation. |
| `serializeToMjml` | `serializeToMjml(state, registry?): string`. Pure; does not mutate state. Throws when a block is absent from the registry. |
| `exportEmail` | `exportEmail(state, overrides?): Promise<EmailExport>`. Does not mutate state. Compiles MJML, applies allowed UTM values to final HTML, and returns delivery output. |
| `EmailExport` | `{ html, mjml, subject, preheader? }`; a transport-independent delivery result. |
| `EmailExportOverrides` | Optional `subject`, partial `tracking`, and `registry`. Overrides win over template defaults. |
| `mergeTracking` | `mergeTracking(defaults, overrides?): TrackingSettings`. Purely merges tracking defaults. |
| `rewriteLinksForUtm` | `rewriteLinksForUtm(html, utm): string`. Rewrites only absolute HTTP(S) anchors with missing UTM values; requires `DOMParser`, otherwise returns input unchanged. |

## Template persistence

| Export | Signature and behavior |
|---|---|
| `TEMPLATE_FORMAT` | The literal `smail-template`. |
| `TEMPLATE_FORMAT_VERSION` | Current file-envelope version, `1`. |
| `DEFAULT_TEMPLATE_MAX_BYTES` | Default untrusted string-import ceiling: 1 MiB UTF-8. |
| `TemplateFile` | `{ format, formatVersion, state }`, the stable editable persistence envelope. |
| `TemplateValidationIssue` | `{ path, message }` validation error or normalization warning. |
| `TemplateParseResult` | Discriminated result: success has `value`, `migrated`, and `warnings`; failure has `errors`. |
| `ParseTemplateOptions` | Optional `registry` for custom-block validation and `maxBytes` for string input. |
| `createTemplateFile` | `createTemplateFile(state): TemplateFile`. Clones state into the current envelope without validation/migration. |
| `serializeTemplateFile` | `serializeTemplateFile(state): string`. Produces formatted versioned JSON. |
| `parseTemplateFile` | `parseTemplateFile(input, options?): TemplateParseResult`. Does not mutate input; accepts a versioned file or supported legacy bare state. |
| `migrateEditorState` | `migrateEditorState(state): EditorState`. Returns a migrated copy; throws for unsupported schema versions. Use `parseTemplateFile` for untrusted input. |

## Blocks and registries

| Export | Signature and behavior |
|---|---|
| `builtinBlocks` | The first-party Text, Image, Button, Divider, Spacer, and Social definitions. |
| `defineBlock` | `defineBlock(definition): definition`. Type-preserving helper for trusted custom block declarations. |
| `BlockDefinition` | `{ type, label, defaultProps, inspector, toMjml, render? }`. `toMjml` must be pure and must sanitize its own untrusted props. |
| `AnyBlockDefinition` | Props-agnostic custom block definition type. |
| `BlockRegistry` | Read-only map of block type to definition. |
| `createRegistry` | `createRegistry(custom?): BlockRegistry`. Custom entries override built-ins with the same type. |
| `defaultRegistry` | Registry containing only the current built-ins. |
| `BuiltinInspectorControl` | Built-in Inspector control-name union. |
| `InspectorControl` | Built-in control name or a registered custom string. |
| `InspectorField` | Field metadata: key, label, control, options, limits, formatter/parser, or per-field component. |
| `SelectOption` | `{ label, value }` option for select-like controls. |
| `ControlProps` | `{ field, value, setValue }` contract supplied to Inspector control components. |
| `ControlRegistry` | `Record<string, Component<ControlProps>>` registered through `createEditor({ controls })`. |
| `TextEditorProps` | Inspector text-editor contract: HTML value/setter, disabled state, parameters, delimiters, and `createParameter`. |
| `normalizeOptions` | `normalizeOptions(options?): SelectOption[]`. Converts string/options input to display/value pairs. |
| `StructuralFields` | Optional replacement field arrays for document, section, and column Inspector nodes. |
| `settingsFields`, `sectionFields`, `columnFields` | Default structural Inspector field definitions. |

## Parameters and sanitization

| Export | Signature and behavior |
|---|---|
| `DEFAULT_DELIMITERS` | Default merge-field delimiters: `{{` and `}}`. |
| `ParamDelimiters` | `{ open: string; close: string }`. |
| `ParameterDef` | `{ key, label?, sample? }`, a declared merge field. |
| `isValidParameterKey` | `isValidParameterKey(key): boolean`. Allows letters/numbers/underscore first, then letters/numbers/underscore/dot/hyphen. |
| `extractParams` | `extractParams(source, delimiters?): string[]`. Returns unique placeholders in first-seen order. |
| `substituteParams` | `substituteParams(source, values, delimiters?): string`. Pure partial replacement; unmatched placeholders remain intact. |
| `mergeParams` | `mergeParams(documentParameters, hostParameters): ParameterDef[]`. Host entries win by key. |
| `sanitizeTextHtml` | `sanitizeTextHtml(value): string`. Keeps the supported rich-text subset; safe in browser and headless environments. |
| `EmailUrlKind` | `link` or `image`, the policy selected by `sanitizeEmailUrl`. |
| `sanitizeEmailUrl` | `sanitizeEmailUrl(value, kind): string | undefined`. Filters built-in URL values; validate send-time placeholder substitutions separately. |

## Factories and schema types

| Export | Signature and behavior |
|---|---|
| `BUILTIN_TEMPLATE_IDS` | Read-only starter-template IDs: `newsletter`, `promotion`, and `transactional`. |
| `BuiltinTemplateId` | Union of the values in `BUILTIN_TEMPLATE_IDS`. |
| `createBuiltinTemplate` | `createBuiltinTemplate(id): EditorState`. Returns a fresh editable starter with no shared mutable state. |
| `SCHEMA_VERSION` | Current editor state version: `0.5`. |
| `newId` | `newId(): string`. Uses `crypto.randomUUID` when available, otherwise a non-cryptographic fallback. |
| `createDefaultTrackingSettings` | Returns disabled UTM tracking defaults. |
| `createDefaultSettings` | Returns a fresh `DocumentSettings` default object. |
| `createEmptyState` | Returns a fresh empty `EditorState`. |
| `createColumn` | `createColumn(partial?): Column`. Returns a fresh empty column. |
| `createSection` | `createSection(columnCount?): Section`. Returns a fresh section with the requested number of columns. |
| `createBlock` | `createBlock(type, registry?): Block`. Clones registered default props; throws for an unknown type. |
| `SOCIAL_NETWORKS` | Supported Social network names. |
| `Align`, `Padding` | Alignment union and pixel-padding record. |
| `EditorState`, `DocumentSettings`, `TrackingSettings`, `UTMTrackingSettings` | Root editable schema and provider-neutral tracking metadata. |
| `Section`, `SectionProps`, `Column`, `ColumnProps` | Layout schema types. |
| `Block`, `BlockType`, `TextBlock`, `ImageBlock`, `ButtonBlock`, `DividerBlock`, `SpacerBlock`, `SocialBlock` | Built-in block unions and concrete block types. |
| `TextBlockProps`, `ImageBlockProps`, `ButtonBlockProps`, `DividerBlockProps`, `SpacerBlockProps`, `SocialBlockProps` | Props for each built-in block. |
| `SocialNetwork`, `SocialElement` | Social network union and individual social-link schema. |

## Tree and width operations

| Export | Signature and behavior |
|---|---|
| `MAX_COLUMNS`, `COLUMN_WIDTH_STEP`, `MIN_COLUMN_WIDTH` | Layout limits: 4 columns, 5% step, 10% minimum per column. |
| `NodeRef` | A found `section`, `column`, or `block` with its parent context. |
| `resolveColumnWidths` | `resolveColumnWidths(columns): number[]`. Pure; resolves invalid/missing widths to 5% values totaling 100. |
| `setColumnWidth` | `setColumnWidth(section, columnId, percent): boolean`. **Mutates** section and proportionally redistributes siblings. |
| `normalizeColumnWidths` | `normalizeColumnWidths(section): boolean`. **Mutates** section into canonical width strings and reports whether it changed. |
| `findNode` | `findNode(state, id): NodeRef | null`. Pure lookup. |
| `targetColumn` | `targetColumn(state, selectedId): Column | null`. Pure selection-to-insertion lookup. |
| `cloneWithNewIds` | `cloneWithNewIds(node): node`. Returns a deep clone with fresh IDs; does not mutate the source. |
| `insertSection` | `insertSection(state, section, index?): Section`. **Mutates** state by inserting the supplied section. |
| `moveSection` | `moveSection(state, sectionId, offset): boolean`. **Mutates** state when a neighbor exists. |
| `duplicateSection` | `duplicateSection(state, sectionId): Section | null`. **Mutates** state by inserting a fresh-ID clone. |
| `addColumn` | `addColumn(state, sectionId, index?): Column | null`. **Mutates** state; returns null at the column cap. |
| `removeColumn` | `removeColumn(state, columnId): boolean`. **Mutates** state; refuses the final column and re-homes removed content. |
| `removeNode` | `removeNode(state, id): boolean`. **Mutates** state; column removal follows `removeColumn` rules. |
| `duplicateBlock` | `duplicateBlock(state, blockId): Block | null`. **Mutates** state by inserting a fresh-ID clone. |
| `moveBlock` | `moveBlock(state, blockId, targetColumnId, index?): boolean`. **Mutates** state by moving the existing block. |

For examples and lifecycle context, see <Link to="/guides/getting-started/" label="Getting started" />, <Link to="/guides/editor-controller/" label="Editor controller" />, <Link to="/guides/persistence-and-delivery/" label="Template files and export" />, and <Link to="/guides/customization/" label="Customization" />.
