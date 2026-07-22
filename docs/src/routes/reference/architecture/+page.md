---
title: Architecture
description: A practical map of smail's editor, data flow, runtime boundaries, and host responsibilities.
sidebarTitle: Architecture
order: 2
---

This page explains how the pieces fit together. Start with <Link to="/guides/getting-started/" label="Getting started" /> to embed an editor, use <Link to="/guides/editor-controller/" label="Editor controller" /> for commands, and use this page when deciding where your application owns state, storage, rendering, or extensions.

## The architecture at a glance

```text
Host application
  │ creates one editing session
  ▼
EditorController ───────────────► MjmlEditor (Svelte view)
  │ owns draft, history, registry       │ Canvas, Inspector, Toolbar, Preview
  │                                      │
  ├── EditorState ──serializeToMjml──► MJML ──compile──► HTML preview/export
  │
  └── TemplateFile ◄── parse / migrate ── .smail.json

Host application owns: storage, message delivery, credentials, recipient data, and custom-block trust.
```

smail has one editable source of truth: `EditorState`. MJML, compiled HTML, the preview, and optional UTM decoration are derived outputs. Do not try to round-trip generated HTML or MJML into the editor.

## Ownership boundaries

| Layer | smail owns | Host application owns |
| --- | --- | --- |
| Editing session | `EditorController`, selection, history, commands, change events, and configured extensions | Creating one controller for each session and deciding when to save a cloned state |
| Svelte UI | Public `MjmlEditor`, its Canvas, Inspector, Toolbar, and Preview behavior | Container size, client-only mounting when needed, `readonly`, and `theme` |
| Editable data | `EditorState`, schema migration, validation, rich-text sanitization, and versioned `TemplateFile` parsing | Where portable template JSON is kept and how it is loaded |
| Rendering | MJML serialization, browser compilation, preview HTML, and delivery output | Sending messages, recipients, sender identity, merge-field values, and provider configuration |
| Extensions | Registry wiring for blocks, Inspector controls, text editors, parameters, and upload callbacks | The correctness and security of custom code, uploads, and resulting URLs/MJML |

Only `MjmlEditor` is a public UI component. The controller is the only supported mutation boundary. Built-in UI subcomponents are internal implementation details.

## Four normal data flows

### 1. Create and mount

The host creates a controller with an initial `EditorState` plus extensions, then passes it to the view.

```ts
const editor = createEditor({ state, blocks, parameters, onChange });
```

`MjmlEditor` reads controller snapshots for rendering. It does not own a separate editable copy, so all user and host changes share one history and notification stream.

### 2. Edit and observe

Canvas and Inspector interactions call controller commands. Each successful document mutation captures history, increments the revision, and notifies `onChange` listeners with a cloned state snapshot.

```text
User action / host command
  → EditorController command
  → history snapshot + change notification
  → MjmlEditor refreshes its view and preview
```

Use `getState()` to obtain a clone for saving or comparison. Do not mutate `editor.document`; use commands, `replaceState` for trusted validated data, or `importTemplate` for JSON input.

### 3. Load and save editable templates

Editable files use a versioned `TemplateFile` envelope. `parseTemplateFile` and `editor.importTemplate` accept supported legacy state, migrate it, sanitize built-in Text content, and normalize columns before use.

```text
.smail.json → parse / validate / migrate → EditorState → EditorController
EditorController → getState() / exportTemplate() → TemplateFile JSON
```

Invalid input produces structured errors and does not replace the active document. The host decides whether to store the resulting JSON locally, remotely, or elsewhere; smail intentionally has no storage adapter.

### 4. Render and export delivery output

`serializeToMjml` converts the state tree into MJML. Browser-only `compile` converts it to HTML for preview and `exportEmail` / `editor.exportDelivery()` returns delivery output.

```text
EditorState → MJML → compiled HTML → optional UTM link decoration → EmailExport
```

UTM decoration affects only final HTML. It never changes `EditorState`, MJML, or the editing preview.

## Data model and layout rules

The document tree is fixed to `body → section → column → block`, which mirrors valid email layout nesting. Built-in blocks are Text, Image, Button, Divider, Spacer, and Social; custom blocks are validated through the controller registry when imported.

Current persisted data uses schema `0.5` and `{ format: 'smail-template', formatVersion: 1, state }`. Template-format compatibility is separate from the controller-first embedding API.

Column widths are stored as percentage strings for compatibility. Canvas and MJML serialization resolve them to 5% steps that total exactly 100%, with a 10% minimum per column. This makes external invalid or missing widths safe to render without silently changing an in-memory state until an explicit normalization or edit occurs.

## Runtime and SSR boundaries

| Operation | SSR-safe | Browser-like DOM required |
| --- | --- | --- |
| Import the package, create a controller, use commands, read state | Yes | No |
| Parse/migrate template JSON and serialize MJML | Yes | No |
| Mount `MjmlEditor` | No | Yes |
| Compile MJML, render preview HTML, call `exportEmail` or `exportDelivery` | No | Yes |

`mjml-browser` is lazy-loaded, so importing smail does not immediately require a DOM. Keep compilation and the visual editor inside an appropriate client boundary in SSR applications.

## Extension and safety boundaries

Built-in Text content is sanitized during editing, import/migration, canvas rendering, and MJML serialization. Built-in Image, Button, and Social URLs are filtered to allowed URL forms. Parameter sample values affect only sample preview; persisted content and exported output retain placeholders.

The following are deliberately host responsibilities:

- `toMjml` and `render` implementations for custom blocks, including escaping user content and validating URLs;
- merge-field values substituted at send time;
- image-upload authorization, validation, storage, and returned URL lifetime;
- storage, message transport, recipients, sender identity, credentials, unsubscribe behavior, tracking pixels, and provider-specific configuration.

See <Link to="/guides/customization/" label="Customization" /> for extension contracts and <Link to="/guides/persistence-and-delivery/" label="Template files and export" /> for parsing and delivery output behavior.

## Quality and production validation

CI verifies types, documentation contracts, unit/component tests, package output, and browser E2E. The external email matrix workflow validates rendering results supplied by a provider, but local fixtures are not proof of Gmail, Apple Mail, or Outlook compatibility. Use the <Link to="/operations/production-readiness/" label="Production readiness" /> and <Link to="/operations/email-rendering-matrix/" label="Email rendering matrix" /> guides before treating a template integration as production-ready.
