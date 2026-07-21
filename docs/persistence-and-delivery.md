# Persistence and delivery

## Template files

Editable templates use the versioned envelope below:

```ts
interface TemplateFile {
	format: 'smail-template';
	formatVersion: 1;
	state: EditorState;
}
```

Use `serializeTemplateFile(state)` to produce formatted JSON and `parseTemplateFile(input, options)` to load it. The parser also accepts legacy bare `EditorState` JSON from schema versions `0.1` through `0.5`.

```ts
import { createRegistry, parseTemplateFile, serializeTemplateFile } from 'smail';

const registry = createRegistry(customBlocks);
const stored = serializeTemplateFile(state);
await database.templates.save({ id: 'welcome', document: stored });

const record = await database.templates.find('welcome');
const result = parseTemplateFile(record.document, { registry });
if (!result.ok) {
	console.error(result.errors); // [{ path, message }, ...]
	return;
}

state = result.value.state;
if (result.warnings.length) notifyUser('The imported template was normalized.');
```

`parseTemplateFile` never mutates an input object. Invalid JSON, unsupported future versions, malformed trees, duplicate IDs, and custom blocks absent from the supplied registry return `ok: false`; do not replace the active editor state on failure.

### Migration and input limits

Migration fills new settings, removes retired SES metadata, sanitizes built-in Text content, and normalizes column widths. String input is limited to `DEFAULT_TEMPLATE_MAX_BYTES` (1 MiB UTF-8) by default:

```ts
const trustedResult = parseTemplateFile(json, { registry, maxBytes: 2 * 1024 * 1024 });
```

Only increase `maxBytes` for trusted sources with a documented storage and denial-of-service policy. Preserve the original stored JSON before overwriting it with migrated output so that rollback remains possible.

## Editor import and export

The Toolbar imports `.smail.json` files and resets selection/history only after a successful parse. With no callback, Export template downloads `email.smail.json`; with `onTemplateExport`, the host owns persistence instead.

`Export state JSON` is a convenience download of bare state. It is not the recommended long-term storage format because it omits the persistence envelope.

## Delivery output

```ts
import { exportEmail } from 'smail';

const output = await exportEmail(state, {
	subject: 'Optional send-time subject',
	tracking: {
		campaignId: 'campaign-2026-01',
		utm: { enabled: true, source: 'newsletter', medium: 'email', campaign: 'launch' }
	}
});

await sender.send({
	to: recipient.address,
	subject: output.subject,
	html: output.html
});
```

`exportEmail` does not mutate the state. It returns `html`, `mjml`, `subject`, and optional `preheader`; it does not send mail or include recipients, sender identity, provider credentials, SES configuration, or recipient-specific metadata.

Send-time `subject` and tracking overrides take precedence over template defaults. When UTM is enabled, only absolute HTTP(S) links in final HTML receive missing UTM parameters. Existing query values, relative links, fragments, `mailto:`, `tel:`, and URLs containing merge-field delimiters remain unchanged. State, MJML, and editor preview are never rewritten.

## Send-time ownership

The sending application owns recipients, sender identity, unsubscribe policy, provider configuration, click/open tracking, and merge-field replacement. Validate substituted values and URLs after replacement; smail can validate stored placeholders, but cannot validate runtime recipient data.
