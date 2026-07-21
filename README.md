# smail

> An embeddable Svelte email-template editor. Store editable JSON, generate MJML, and export email HTML.

smail provides a visual `MjmlEditor` and headless APIs for template persistence and delivery output. `EditorState` is the source of truth; MJML, HTML, previews, and UTM links are derived values. The package is currently alpha—use the [production readiness guide](./docs/production-readiness.md) before a release.

## Install

```sh
npm i smail mjml-browser
```

`svelte >= 5` and `mjml-browser 4.x` are peer dependencies. Use `mjml-browser` 4.x: its 5.x browser bundle is not compatible with Vite bundling.

## Quick start

```svelte
<script lang="ts">
	import { MjmlEditor, createBuiltinTemplate } from 'smail';

	let state = $state(createBuiltinTemplate('newsletter'));
</script>

<div style="height: 100vh">
	<MjmlEditor bind:state onChange={(next) => saveTemplate(next)} />
</div>
```

The component is controlled: bind `state` when the host owns the editable document. Use `readonly` for preview-only mode. See [Getting started](./docs/getting-started.md) for callbacks, SSR, themes, and starter templates.

## Persist and export

```ts
import { createRegistry, exportEmail, parseTemplateFile, serializeTemplateFile } from 'smail';

await database.templates.save({ id, document: serializeTemplateFile(state) });

const saved = await database.templates.find(id);
const loaded = parseTemplateFile(saved.document, { registry: createRegistry(customBlocks) });
if (!loaded.ok) throw new Error(loaded.errors.map((issue) => issue.message).join('\n'));

const email = await exportEmail(loaded.value.state, {
	tracking: { utm: { enabled: true, source: 'newsletter', campaign: 'launch' } }
});
await provider.send({ subject: email.subject, html: email.html });
```

Store versioned `.smail.json`, not HTML, as the editable source. `parseTemplateFile` migrates supported legacy state and returns warnings/errors without mutating the input. See [Persistence and delivery](./docs/persistence-and-delivery.md) for the full contract.

## Capabilities and boundaries

- Built-in Text, Image, Button, Divider, Spacer, and Social blocks; one to four columns with normalized 100% widths.
- Rich text with safe formatting, parameter insertion, sample preview, custom Inspector controls, custom text editors, image upload hooks, and CSS-token themes.
- Built-in text and URL values are sanitized. Custom block `toMjml` implementations and send-time merge-field values are trusted host responsibilities.
- smail does not send email, configure SES or another provider, inject tracking pixels, or support arbitrary HTML/CSS, complex tables, video embeds, or AMP Email.

## Documentation

- [Documentation index](./docs/README.md)
- [Getting started](./docs/getting-started.md)
- [Persistence and delivery](./docs/persistence-and-delivery.md)
- [Customization](./docs/customization.md)
- [API reference](./docs/api-reference.md)
- [Architecture](./docs/architecture.md)
- [Production readiness](./docs/production-readiness.md)
- [External email rendering matrix](./docs/email-rendering-matrix.md)

## Development

```sh
bun install
bun run dev
bun run check
bun run docs:check
bun run test
bun run build
bun run e2e
bun run generate:matrix
bun run verify:matrix -- results.json
```

Local checks and browser E2E do not replace real Gmail, Apple Mail, or Outlook rendering. Generate fixtures and run the external matrix gate before production releases.

## License

MIT
