# smail

> An embeddable Svelte email-template editor. Store editable JSON, generate MJML, and export email HTML.

smail provides a visual `MjmlEditor` and headless APIs for template persistence and delivery output. In 1.0, an `EditorController` owns the editable draft; MJML, HTML, previews, and UTM links are derived values.

## Install

```sh
npm i https://github.com/slime21023/smail/releases/download/v1.0.0/smail-1.0.0.tgz mjml-browser
```

Replace `1.0.0` with the release version to install. `svelte >= 5` and `mjml-browser 4.x` are peer dependencies. Use `mjml-browser` 4.x: its 5.x browser bundle is not compatible with Vite bundling.

## Quick start

```svelte
<script lang="ts">
	import { MjmlEditor, createBuiltinTemplate, createEditor } from 'smail';

	const editor = createEditor({ state: createBuiltinTemplate('newsletter') });
</script>

<div style="height: 100vh">
<MjmlEditor {editor} />
</div>
```

Use `editor.getState()` to save a clone, `editor.replaceState(...)` to load a trusted validated document, and `editor.subscribe(...)` to observe changes. Use `readonly` for preview-only mode. See [Getting started](https://slime21023.github.io/smail/guides/getting-started/) for the minimal embed, then [Editor controller](https://slime21023.github.io/smail/guides/editor-controller/) for state ownership, commands, import/export, and SSR boundaries.

## Template files and export

```ts
import { exportEmail, parseTemplateFile, serializeTemplateFile } from 'smail';

const templateJson = serializeTemplateFile(editor.getState());
const loaded = parseTemplateFile(templateJson);
if (!loaded.ok) throw new Error(loaded.errors.map((issue) => issue.message).join('\n'));

const delivery = await exportEmail(loaded.value.state, {
	tracking: { utm: { enabled: true, source: 'newsletter', campaign: 'launch' } }
});

console.log(delivery.html);
```

Store versioned `.smail.json`, not HTML, as the editable source. `parseTemplateFile` migrates supported legacy state and returns warnings/errors without mutating the input. The JSON can be kept through any host mechanism; smail does not provide a storage adapter. See [Template files and export](https://slime21023.github.io/smail/guides/persistence-and-delivery/) for the full contract.

## Capabilities and boundaries

- Built-in Text, Image, Button, Divider, Spacer, and Social blocks; one to four columns with normalized 100% widths.
- Rich text with safe formatting, parameter insertion, sample preview, custom Inspector controls, custom text editors, image upload hooks, and CSS-token themes.
- Built-in text and URL values are sanitized. Custom block `toMjml` implementations and send-time merge-field values are trusted host responsibilities.
- smail does not include a storage adapter, email transport, arbitrary HTML/CSS, complex tables, video embeds, or AMP Email.

## Documentation

- [Developer documentation](https://slime21023.github.io/smail/)
- [Getting started](https://slime21023.github.io/smail/guides/getting-started/)
- [Editor controller](https://slime21023.github.io/smail/guides/editor-controller/)
- [Template files and export](https://slime21023.github.io/smail/guides/persistence-and-delivery/)
- [Customization](https://slime21023.github.io/smail/guides/customization/)
- [API reference](https://slime21023.github.io/smail/reference/api/)
- [Architecture and security model](https://slime21023.github.io/smail/reference/architecture/)
- [Production readiness](https://slime21023.github.io/smail/operations/production-readiness/)
- [External email rendering matrix](https://slime21023.github.io/smail/operations/email-rendering-matrix/)

## Development

```sh
bun install
bun run dev
bun run check
bun run docs:check
bun run docs:dev
bun run docs:build
bun run test
bun run build
bun run e2e
bun run generate:matrix
bun run verify:matrix -- results.json
```

Local checks and browser E2E do not replace real Gmail, Apple Mail, or Outlook rendering. Generate fixtures and run the external matrix gate before production releases.

## License

MIT
