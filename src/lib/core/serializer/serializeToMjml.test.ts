import { describe, expect, it } from 'vitest';
import { compile } from '../compiler/compile.js';
import { builtinBlocks } from '../registry/builtins.js';
import { createBlock, createColumn, createEmptyState, createSection } from '../schema/defaults.js';
import type { Block, BlockType, EditorState } from '../schema/types.js';
import { serializeToMjml } from './serializeToMjml.js';

function stateWith(blocks: Block[]): EditorState {
	const state = createEmptyState();
	const section = createSection(1);
	section.columns[0].blocks = blocks;
	state.body = [section];
	return state;
}

describe('serializeToMjml', () => {
	it('serializes an empty document', () => {
		expect(serializeToMjml(createEmptyState())).toMatchInlineSnapshot(`
			"<mjml>
			  <mj-head>
			    <mj-attributes>
			      <mj-all font-family="Arial, sans-serif" />
			      <mj-text color="#333333" />
			    </mj-attributes>
			    <mj-style>a { color: #2563eb; }</mj-style>
			  </mj-head>
			  <mj-body background-color="#f4f4f4" width="600px"></mj-body>
			</mjml>"
		`);
	});

	it('emits mj-preview when preheader is set', () => {
		const state = createEmptyState();
		state.settings.preheader = '本週電子報 <img>';
		expect(serializeToMjml(state)).toContain(
			'<mj-preview>本週電子報 &lt;img&gt;</mj-preview>'
		);
	});

	it('serializes every built-in block with default props', () => {
		const types = builtinBlocks.map((def) => def.type) as BlockType[];
		const state = stateWith(types.map((type) => createBlock(type)));
		expect(serializeToMjml(state)).toMatchSnapshot();
	});

	it('escapes attribute values and button text', () => {
		const button = createBlock('button');
		button.props.text = 'Buy "now" & <save>';
		button.props.href = 'https://example.com/?a=1&b=2';
		const mjml = serializeToMjml(stateWith([button]));
		expect(mjml).toContain('href="https://example.com/?a=1&amp;b=2"');
		expect(mjml).toContain('>Buy &quot;now&quot; &amp; &lt;save&gt;</mj-button>');
	});

	it('passes text content through as inline HTML', () => {
		const text = createBlock('text');
		text.props.content = 'Hello <strong>world</strong>';
		expect(serializeToMjml(stateWith([text]))).toContain('Hello <strong>world</strong>');
	});

	it('omits optional attributes that are unset', () => {
		const text = createBlock('text');
		const mjml = serializeToMjml(stateWith([text]));
		expect(mjml).not.toContain('color=""');
		expect(mjml).not.toContain('font-weight');
		expect(mjml).not.toContain('width=" ');
	});

	it('splits columns and keeps explicit widths', () => {
		const state = createEmptyState();
		const section = createSection(2);
		section.columns[0].props.width = '30%';
		state.body = [section];
		const mjml = serializeToMjml(state);
		expect(mjml).toContain('<mj-column width="30%" vertical-align="top">');
		expect(mjml).toContain('<mj-column vertical-align="top">');
	});

	it('is deterministic for the same input', () => {
		const state = stateWith([createBlock('text'), createBlock('button')]);
		expect(serializeToMjml(state)).toBe(serializeToMjml(state));
	});

	it('produces MJML that compiles without errors', async () => {
		const types = builtinBlocks.map((def) => def.type) as BlockType[];
		const state = createEmptyState();
		state.settings.preheader = 'Preview text';
		const section = createSection(2);
		section.columns[0].blocks = types.slice(0, 3).map((type) => createBlock(type));
		section.columns[1].blocks = types.slice(3).map((type) => createBlock(type));
		state.body = [createSection(1), section];

		const result = await compile(serializeToMjml(state));
		expect(result.errors).toEqual([]);
		expect(result.html).toContain('<!doctype html>');
	});

	it('throws for a block type missing from the registry', () => {
		const rogue = { id: 'x', type: 'bogus', props: {} } as unknown as Block;
		expect(() => serializeToMjml(stateWith([rogue]))).toThrowError(/bogus/);
	});
});
