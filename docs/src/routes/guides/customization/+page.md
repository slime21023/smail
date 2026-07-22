---
title: Customization
description: Extend blocks, controls, text editing, parameters, and themes.
sidebarTitle: Customization
order: 3
---

All extensions are captured by `createEditor` for the controller lifetime. This lets editing, template import, and delivery export share one registry and one parameter/text-editing contract. View-only `readonly` and `theme` stay on `MjmlEditor`; see <Link to="/guides/editor-controller/" label="Editor controller" /> for the ownership model.

## Custom blocks

Register custom blocks with `defineBlock` and pass them to `createEditor`.

```ts
import { defineBlock } from 'smail';

const escapeXml = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const notice = defineBlock({
	type: 'notice',
	label: 'Notice',
	defaultProps: { message: 'Important update' },
	inspector: [{ key: 'message', label: 'Message', control: 'text' }],
	toMjml: (props) => `<mj-text font-weight="bold">${escapeXml(props.message)}</mj-text>`
});
```

```svelte
<script lang="ts">
	import { MjmlEditor, createEditor, createEmptyState } from 'smail';

	const editor = createEditor({ state: createEmptyState(), blocks: [notice] });
</script>
<MjmlEditor {editor} />
```

`toMjml` must be pure and deterministic. It is trusted host code: smail does not sanitize custom MJML, escape custom props, validate URLs, or guarantee its rendering in email clients. Register the same block definitions in `parseTemplateFile(..., { registry })`, otherwise imported custom blocks are rejected.

## Inspector controls

Each field can select a built-in control or a registered custom control. A control receives `ControlProps`:

```svelte
<script lang="ts">
	import type { ControlProps } from 'smail';
	let { field, value, setValue }: ControlProps = $props();
</script>

<label>
	{field.label}
	<input value={String(value ?? '')} oninput={(event) => setValue(event.currentTarget.value)} />
</label>
```

```svelte
<script lang="ts">
	import { createEditor, createEmptyState } from 'smail';

const editor = createEditor({ state: createEmptyState(), controls: { swatch: SwatchControl } });
</script>
```

Use `InspectorField.component` for a single field or `controls` for a named reusable control. `format` and `parse` map the stored value to/from the control value. `structuralFields` replaces document, section, or column Inspector field lists.

## Text editors and parameters

`textEditor` replaces only the Inspector Text content editor. It receives `TextEditorProps`:

```ts
interface TextEditorProps {
	value: string;
	setValue(html: string): void;
	disabled: boolean;
	parameters: ParameterDef[];
	delimiters: ParamDelimiters;
	createParameter(key: string, label?: string): ParameterDef | null;
}
```

`setValue` is sanitized before it is persisted. `createParameter` returns an existing parameter or a newly stored one, and returns `null` for an invalid key. The canvas keeps smail's built-in double-click editor and toolbar.

```svelte
<script lang="ts">
	import { createEditor, createEmptyState } from 'smail';

const editor = createEditor({
	state: createEmptyState(),
	textEditor: MyTextEditor,
	parameters: [{ key: 'firstName', label: 'First name', sample: 'Ada' }],
	paramDelimiters: { open: '{{', close: '}}' }
});
</script>
```

Host-provided `parameters` win on duplicate keys and are read-only in the document Inspector. End users can create their own parameters, which persist in `settings.parameters`. Sample values affect only sample preview; exported HTML keeps raw placeholders for the sending application.

## Image upload and styling

```svelte
<script lang="ts">
	import { MjmlEditor, createEditor, createEmptyState } from 'smail';

const editor = createEditor({ state: createEmptyState(), onImageUpload: async (file) => uploadToCdn(file) });
</script>
<MjmlEditor {editor} theme={{ accent: '#0f766e', 'panel-bg': '#f8fafc' }} />
```

When `onImageUpload` resolves to a hosted URL, the Image Inspector writes it to the selected block. The callback must enforce upload authorization, size/type checks, storage policy, and URL lifetime. Theme tokens become `--sme-*` CSS variables; host CSS may override them directly.

## Built-in sanitizer boundary

Built-in Text keeps only `p`, `br`, `h1`–`h6`, `strong`, `em`, `u`, `a`, `ul`, `ol`, and `li` with safe link values. Built-in Image, Button, and Social URLs are filtered to supported schemes. This boundary does not apply to custom block MJML or data substituted into placeholders at send time.
