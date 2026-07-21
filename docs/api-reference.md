# API reference

All APIs below are exported from `smail`. Functions marked **mutates** change the supplied state or section in place; all other helpers return new data or derived output.

## Editor UI

| Export | Contract |
|---|---|
| `MjmlEditor` | Controlled Svelte component. Required `state`; supports `bind:state`. Props: `onChange`, legacy `onExport`, `onTemplateExport`, `onDeliveryExport`, `blocks`, `controls`, `textEditor`, `structuralFields`, `parameters`, `paramDelimiters`, `persistParameters`, `onImageUpload`, `theme`, and `readonly`. Rendering/compilation needs a browser. |
| `ThemeTokens` | `Record<string, string>` applied as `--sme-<key>` variables on the editor root. |

`onTemplateExport(file)` receives a cloned `TemplateFile`. `onDeliveryExport(output)` receives fresh delivery output. `onExport(html, json)` is retained only for legacy integrations.

## Compilation and delivery

| Export | Signature and behavior |
|---|---|
| `compile` | `compile(mjml): Promise<CompileResult>`. Lazy-loads `mjml-browser`, requires a browser-like DOM when called, uses soft MJML validation, and caches equal input. |
| `CompileResult` | `{ html: string; errors: MjmlError[] }`. Compile errors are returned, not thrown by normal soft validation. |
| `serializeToMjml` | `serializeToMjml(state, registry?): string`. Pure; does not mutate state. Throws when a block is absent from the registry. |
| `exportEmail` | `exportEmail(state, overrides?): Promise<EmailExport>`. Does not mutate state or send mail. Compiles MJML, applies allowed UTM values to final HTML, and returns delivery metadata. |
| `EmailExport` | `{ html, mjml, subject, preheader? }`; excludes recipients, sender, credentials, and provider configuration. |
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
| `ControlRegistry` | `Record<string, Component<ControlProps>>` registered through `MjmlEditor.controls`. |
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

For examples and lifecycle context, see [Getting started](./getting-started.md), [Persistence and delivery](./persistence-and-delivery.md), and [Customization](./customization.md).
