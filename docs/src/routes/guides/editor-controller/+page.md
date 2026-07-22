---
title: Editor controller
description: Own a smail editing session, observe changes, and perform document commands.
sidebarTitle: Editor controller
order: 2
---

`EditorController` is the primary integration boundary in smail 1.0. Create one controller for each editable template session, configure its extensions once, and pass it to the Svelte view.

## Create and render a session

```svelte
<script lang="ts">
	import { MjmlEditor, createBuiltinTemplate, createEditor } from 'smail';

	const editor = createEditor({
		state: createBuiltinTemplate('newsletter'),
		parameters: [{ key: 'firstName', label: 'First name', sample: 'Ada' }]
	});
</script>

<MjmlEditor {editor} />
```

Create the controller outside render-time reactive code so one user session keeps one selection and history timeline. `MjmlEditor` is a view: it receives the required `editor` and optional view-level `readonly` and `theme` props. Blocks, Inspector controls, text editors, parameters, delimiters, uploads, and callbacks belong in `createEditor`, not on `MjmlEditor`.

## State ownership and changes

The controller owns the live draft. `editor.document` is a reactive view for smail UI rendering only; do not mutate it from host code. `getState()` returns an isolated clone that is safe to serialize or retain. Call `subscribe(listener)` to observe later document snapshots.

```ts
const unsubscribe = editor.subscribe(({ source, state }) => {
	// `state` is a clone. Save or compare it without changing the editor draft.
	console.info(source, state.settings.templateName);
});

// Call this when the host no longer needs updates.
unsubscribe();
```

Change sources are `command`, `undo`, `redo`, `import`, and `replace`. Use them when host UI needs to distinguish an ordinary edit from loading or history navigation.

Use `replaceState(state)` only for a trusted, already validated `EditorState`. It clears selection and starts a new history baseline. For JSON from files, users, or another untrusted boundary, use `importTemplate(json)` instead:

```ts
const result = editor.importTemplate(templateJson);

if (!result.ok) {
	console.error(result.errors); // [{ path, message }, ...]
} else if (result.warnings.length) {
	console.info('The imported template was normalized.', result.warnings);
}
```

On failure, `importTemplate` leaves the active draft, selection, and history unchanged. On success, it uses the controller registry, resets selection/history, and emits an `import` change.

## Edit with commands

Controller commands are the supported mutation path. Successful document commands capture history and emit a cloned `EditorChange`; commands constrained by document rules return `{ ok: false }` without changing the draft.

| Task | Commands |
| --- | --- |
| Selection | `select(id)`; inspect `selectedId` or `selectedNode`. |
| Content and structure | `addSection`, `addBlock`, `remove`, `duplicate`, `moveSection`, `replaceSections`, and `setColumnBlocks`. |
| Columns and layout | `addColumn`, `removeColumn`, and `setColumnWidth`. Widths are normalized to the supported 100% layout. |
| Inspector values | `setField(nodeId, key, value)`, `setTextContent(blockId, html)`, and `setTracking(tracking)`. Text content is sanitized before persistence. |
| Parameters | `createParameter`, `setParameters`, and `setHostParameters`. Host parameters remain protected when keys overlap. |
| History | `undo`, `redo`, `canUndo`, and `canRedo`. |

For example, a host action can add a block to the current target column:

```ts
editor.addBlock('button');
editor.setField(editor.selectedId, 'text', 'Read the update');

const changed = editor.setColumnWidth(columnId, 60);
if (!changed.ok) console.warn('The requested width is not allowed.');
```

Use the typed API reference for every method’s return value and mutation rule.

## Export and callbacks

`exportTemplate()` returns a versioned editable `TemplateFile`. `exportDelivery()` asynchronously returns `{ html, mjml, subject, preheader }` using the same custom-block registry as the editor.

```ts
const templateFile = editor.exportTemplate();
const delivery = await editor.exportDelivery();
```

`onTemplateExport` and `onDeliveryExport` in `EditorOptions` receive those values whenever the corresponding controller export command is called. In the built-in Toolbar, a configured callback takes precedence; otherwise template export downloads `.smail.json` and delivery export downloads HTML. smail does not store templates or send messages.

## Browser and SSR boundary

Creating a controller, reading state, using commands, parsing template files, and migration are SSR-safe. Render `MjmlEditor` only in a suitable client UI boundary. `exportDelivery()` and headless `exportEmail()` compile MJML with `mjml-browser`, so they require a browser-like DOM.

## Next steps

- Save, load, and validate editable JSON in <Link to="/guides/persistence-and-delivery/" label="Template files and export" />.
- Configure blocks, controls, rich text, and merge fields in <Link to="/guides/customization/" label="Customization" />.
- Review signatures and ownership guarantees in the <Link to="/reference/api/" label="API reference" />.
