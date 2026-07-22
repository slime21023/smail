---
title: Getting started
description: Install smail, create a controller-owned editor, and embed its Svelte view.
sidebarTitle: Getting started
order: 1
---

## Requirements

Install the released `smail` tarball, `mjml-browser@4`, and Svelte 5. Replace `1.0.0` with the release version. The package root is safe to import in an SSR module because `mjml-browser` loads only when compilation is requested. Calling `compile()` or `exportEmail()` requires a browser-like DOM.

```sh
npm i https://github.com/slime21023/smail/releases/download/v1.0.0/smail-1.0.0.tgz mjml-browser
```

## Embed the editor

```svelte
<script lang="ts">
	import { MjmlEditor, createEditor, createEmptyState } from 'smail';

	const editor = createEditor({ state: createEmptyState() });
</script>

<MjmlEditor {editor} />
```

`EditorController` owns the editable draft. Do not edit generated MJML or HTML and then expect the editor to preserve it. Use controller commands for all document changes and `getState()` to obtain a saveable clone. The <Link to="/guides/editor-controller/" label="Editor controller guide" /> explains state ownership, loading, subscriptions, commands, and exports.

### Callbacks and readonly mode

```svelte
<script lang="ts">
	const editor = createEditor({
		state: createEmptyState(),
		onChange: ({ source, state }) => console.info(source, state),
		onTemplateExport: (file) => console.info(file),
		onDeliveryExport: (email) => console.info(email)
	});
</script>

<MjmlEditor {editor} readonly={viewerOnly} />
```

`onTemplateExport` receives the versioned editable file and `onDeliveryExport` receives a fresh `{ html, mjml, subject, preheader }` result. In readonly mode, mutation UI and template import are hidden while preview and export remain available.

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
<MjmlEditor {editor} theme={{ accent: '#7c3aed', 'panel-bg': '#fafafa', radius: '10px' }} />
```

You may override `--sme-*` variables with host CSS. Give the editor a defined height; the editor itself does not choose a page-level size. Test narrow containers when using a custom theme or a custom text editor.

## Next steps

- Learn the controller lifecycle and programmatic commands in <Link to="/guides/editor-controller/" label="Editor controller" />.
- Create and export template files with <Link to="/guides/persistence-and-delivery/" label="Template files and export" />.
- Add blocks, controls, and merge fields with <Link to="/guides/customization/" label="Customization" />.
- Review props and helpers in the <Link to="/reference/api/" label="API reference" />.
