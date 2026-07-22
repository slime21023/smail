---
title: Template files and export
description: Create editable template files and generate delivery-ready HTML output.
sidebarTitle: Template files and export
order: 2
---

## Template files

Editable templates use the versioned envelope below:

```ts
interface TemplateFile {
	format: 'smail-template';
	formatVersion: 1;
	state: EditorState;
}
```

Use `createTemplateFile(state)` when you need the in-memory envelope, `serializeTemplateFile(state)` for formatted JSON, and `parseTemplateFile(input, options)` to inspect a file before creating or replacing an editor. The parser also accepts legacy bare `EditorState` JSON from schema versions `0.1` through `0.5`.

```ts
import {
	createTemplateFile,
	parseTemplateFile,
	serializeTemplateFile
} from 'smail';

const templateFile = createTemplateFile(state);
const templateJson = serializeTemplateFile(templateFile.state);

const parsed = parseTemplateFile(templateJson);
if (!parsed.ok) {
	console.error(parsed.errors); // [{ path, message }, ...]
	return;
}

state = parsed.value.state;
if (parsed.warnings.length) console.info('The template was normalized.');
```

`parseTemplateFile` never mutates an input object. Invalid JSON, unsupported future versions, malformed trees, duplicate IDs, and custom blocks absent from a supplied registry return `ok: false`; do not replace the active editor state on failure. The returned JSON is portable: your application may keep it wherever it already keeps data, and smail does not provide a storage adapter.

When a controller already exists, prefer its `importTemplate(templateJson)` command. It parses with the controller's block registry, replaces state only on success, resets selection/history, and emits an `import` change. See <Link to="/guides/editor-controller/" label="Editor controller" /> for the ownership and notification contract.

### Migration and input limits

Migration fills new settings, removes retired SES metadata, sanitizes built-in Text content, and normalizes column widths. String input is limited to `DEFAULT_TEMPLATE_MAX_BYTES` (1 MiB UTF-8) by default:

```ts
const trustedResult = parseTemplateFile(json, { registry, maxBytes: 2 * 1024 * 1024 });
```

Only increase `maxBytes` when the input source is trusted and its size is controlled.

## Editor import and export

The Toolbar imports `.smail.json` files and resets selection/history only after a successful parse. Create the controller with `onTemplateExport` to receive the generated `TemplateFile`; otherwise the Toolbar downloads `email.smail.json`.

For programmatic use, `editor.importTemplate(templateJson)` returns the same structured result as `parseTemplateFile`, without replacing the current document on failure. `editor.exportTemplate()` returns a `TemplateFile` and `editor.exportDelivery()` produces fresh delivery output using the controller's custom-block registry. Call `editor.getState()` when the host needs a clone for a separate serialization workflow.

## Delivery output

```ts
import { exportEmail } from 'smail';

const delivery = await exportEmail(state, {
	subject: 'Optional send-time subject',
	tracking: {
		campaignId: 'campaign-2026-01',
		utm: { enabled: true, source: 'newsletter', medium: 'email', campaign: 'launch' }
	}
});

console.log(delivery.html);
console.log(delivery.mjml);
```

`exportEmail` does not mutate the state. It returns `html`, `mjml`, `subject`, and optional `preheader`.

Send-time `subject` and tracking overrides take precedence over template defaults. When UTM is enabled, only absolute HTTP(S) links in final HTML receive missing UTM parameters. Existing query values, relative links, fragments, `mailto:`, `tel:`, and URLs containing merge-field delimiters remain unchanged. State, MJML, and editor preview are never rewritten.

## Library boundary

smail creates editable template files and delivery output. It does not include a storage adapter or email transport, so integrations decide what to do with the JSON and `EmailExport` result.
