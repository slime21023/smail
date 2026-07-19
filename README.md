# smail

> Embeddable EDM / email template editor for Svelte — JSON in, battle-tested MJML HTML out, compiled entirely in the browser.

Built with **Svelte 5 (runes)**, **[zag.js](https://zagjs.com)** (headless UI state machines), and **[mjml-browser](https://github.com/mjmlio/mjml)** (client-side compilation, no backend needed).

**Status: alpha.** Spec milestones M0–M5 are implemented (visual editing, drag & drop, undo/redo, custom blocks, live preview, HTML/JSON export, multi-column structure editing, custom inspector controls, inline text editing). See [`_spec.md`](./_spec.md) for the full design document.

## Install

```sh
npm i smail mjml-browser
# svelte >= 5 and mjml-browser 4.x are peer dependencies
```

> ⚠️ Use `mjml-browser` **4.x**. The 5.x browser bundle declares `cheerio` as an external dependency, which breaks Vite bundling.

## Quick start

```svelte
<script>
	import { MjmlEditor, createEmptyState } from 'smail';

	let state = $state(createEmptyState());
</script>

<div style="height: 100vh">
	<MjmlEditor
		bind:state
		onChange={(s) => save(s)}
		onExport={(html, json) => deliver(html)}
	/>
</div>
```

The editor is a controlled component: `state` (an `EditorState` JSON tree) is the single source of truth. MJML and HTML are derived — never edited directly.

### Headless usage (no UI)

```ts
import { serializeToMjml, compile } from 'smail';

const mjml = serializeToMjml(state);
const { html, errors } = await compile(mjml); // browser/DOM required at call time
```

`compile()` is async: it lazy-loads `mjml-browser` so importing `smail` stays SSR-safe.

### Custom blocks

```ts
import { defineBlock } from 'smail';
import PriceTagView from './PriceTagView.svelte';

const priceTag = defineBlock({
	type: 'priceTag',
	label: 'Price tag',
	defaultProps: { amount: 4900, currency: 'TWD' },
	inspector: [
		{ key: 'amount', label: 'Amount', control: 'number', min: 0 },
		{ key: 'currency', label: 'Currency', control: 'select', options: ['TWD', 'USD'] }
	],
	toMjml: (p) => `<mj-text>${p.currency} ${p.amount}</mj-text>`,
	render: PriceTagView
});
```

Pass it via `<MjmlEditor blocks={[priceTag]} />`. Custom definitions with a built-in `type` override the built-in.

### Custom inspector controls

The built-in control set (`text`, `textarea`, `number`, `color`, `select`, `segment`, `padding`, `slider`) is open. Register your own by name, or per field:

```svelte
<script>
	import SwatchControl from './SwatchControl.svelte'; // implements ControlProps
</script>

<MjmlEditor controls={{ swatch: SwatchControl }} ... />
```

A control component receives `{ field, value, setValue }` (`ControlProps`). Fields support `{ label, value }` option pairs, a `unit` suffix, and `format`/`parse` hooks to map between stored and edited values. Section/column/document fields can be overridden wholesale via the `structuralFields` prop.

### Theming

All editor chrome is styled with `--sme-*` CSS variables. Override them via the `theme` prop (`{ accent: '#7c3aed', 'panel-bg': '#fafafa' }`) or plain CSS.

## Development

```sh
bun install
bun run dev        # demo playground
bun run test       # vitest unit tests
bun run check      # svelte-check
bun run build      # library build + publint
bun run e2e        # browser E2E (Windows/Edge or set SMAIL_E2E_CHANNEL)
```

## License

MIT
