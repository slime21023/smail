# Architecture

## Source of truth and rendering

`EditorState` is the only editable source of truth. Its tree is constrained to `body → section → column → block`, mirroring valid MJML nesting. The editor derives MJML with `serializeToMjml`, compiles it with `mjml-browser`, and displays HTML in an iframe preview.

```text
EditorState ──serializeToMjml──> MJML ──compile──> HTML
     │                                        │
     └── TemplateFile JSON <──parse/migrate───┘
```

The compiler lazy-loads `mjml-browser` so importing `smail` remains SSR-safe. A call to `compile` or `exportEmail` needs a browser-like DOM. Equal MJML input is cached; compilation uses MJML soft validation and returns errors for preview display.

## Schema and layout

Current state schema is `0.5`; editable files use `{ format: 'smail-template', formatVersion: 1, state }`. Migration accepts legacy schema `0.1`–`0.5`, fills defaults, drops retired SES fields, normalizes rich text, and canonicalizes column widths.

Columns store percentage strings for compatibility, but Canvas and serializer both call `resolveColumnWidths`. Resolved widths use 5% steps, sum to exactly 100%, and keep every column at least 10%. Adjusting a selected column uses the remaining space proportionally; adding columns creates an equal normalized layout; removing a column moves its blocks into a sibling.

## Text and parameter flow

Text editing is a restricted WYSIWYG workflow. Sanitization runs when content is edited, imported/migrated, rendered on canvas, and serialized to MJML. The sanitizer permits only email-focused structural and emphasis tags with safe link attributes.

Host `parameters` merge over persisted `settings.parameters`. Text toolbars insert placeholders using configured delimiters. Sample preview substitutes only the preview HTML; persistence, MJML, and delivery HTML retain placeholders. The sending application owns recipient data and validates values after substitution.

## Security model

Built-in Text HTML and built-in Image/Button/Social URLs are sanitized. UTM rewriting runs only on final compiled absolute HTTP(S) anchors and does not change state or MJML. This library does not validate:

- custom-block `toMjml` output;
- merge-field values supplied at send time;
- image-upload authorization or storage policy;
- recipients, sender identity, provider credentials, unsubscribe rules, or tracking pixels.

Hosts must enforce those boundaries and test their custom output in target email clients.

## Quality and release

`check`, `docs:check`, unit/component tests, build/publint, and browser E2E run in CI. `generate:matrix` produces HTML fixtures for an external rendering service; `verify:matrix` validates the provider-neutral result contract. Local tests and `matrix-example.json` verify code and workflow shape only—they are not evidence of Gmail, Apple Mail, or Outlook compatibility. See [Production readiness](./production-readiness.md).
