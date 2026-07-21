# Getting started

## Requirements

Install `smail`, `mjml-browser@4`, and Svelte 5. The package root is safe to import in an SSR module because `mjml-browser` loads only when compilation is requested. Calling `compile()` or `exportEmail()` requires a browser-like DOM.

```sh
npm i smail mjml-browser
```

## Embed the editor

```svelte
<script lang="ts">
	import { MjmlEditor, createEmptyState, type EditorState } from 'smail';

	let state: EditorState = $state(createEmptyState());
	let saving = $state(false);

	async function save(next: EditorState) {
		saving = true;
		try {
			await api.save(next);
		} finally {
			saving = false;
		}
	}
</script>

<MjmlEditor bind:state onChange={save} />
{#if saving}<p>Saving…</p>{/if}
```

`state` is the editable document. Do not edit generated MJML or HTML and then expect the editor to preserve it. `onChange` is called after user changes, not on the initial render.

### Callbacks and readonly mode

```svelte
<MjmlEditor
	bind:state
	readonly={viewerOnly}
	onTemplateExport={(file) => api.saveFile(file)}
	onDeliveryExport={(email) => api.queue(email)}
	onExport={(html, bareStateJson) => legacyDownload(html, bareStateJson)}
/>
```

Prefer `onTemplateExport` for editable versioned files and `onDeliveryExport` for a fresh `{ html, mjml, subject, preheader }` result. `onExport` is retained for legacy consumers. In readonly mode, mutation UI and template import are hidden while preview and export remain available.

## Starter templates

```ts
import { createBuiltinTemplate } from 'smail';

const newsletter = createBuiltinTemplate('newsletter');
newsletter.settings.fontFamily = 'Inter, Arial, sans-serif';
newsletter.settings.linkColor = '#7c3aed';
```

Available starters are `newsletter`, `promotion`, and `transactional`. Each call returns a fresh document with independent IDs and no shared mutable state.

## Themes and layout

`theme` keys map to CSS custom properties on the editor root. For example, `{ accent: '#7c3aed' }` becomes `--sme-accent: #7c3aed`.

```svelte
<MjmlEditor
	bind:state
	theme={{ accent: '#7c3aed', 'panel-bg': '#fafafa', radius: '10px' }}
/>
```

You may override `--sme-*` variables with host CSS. Give the editor a defined height; the editor itself does not choose a page-level size. Test narrow containers when using a custom theme or a custom text editor.

## Next steps

- Save and deliver templates with [Persistence and delivery](./persistence-and-delivery.md).
- Add blocks, controls, and merge fields with [Customization](./customization.md).
- Review props and helpers in the [API reference](./api-reference.md).
