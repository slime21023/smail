import { defaultRegistry, type BlockRegistry } from '../registry/registry.js';
import type { Block, Column, EditorState, Section } from '../schema/types.js';
import { attrs, escapeXml, indent, paddingValue, px } from './format.js';

/**
 * Serialize editor state to an MJML document string (spec §5).
 * Pure and deterministic: same state and registry always yield the same output.
 */
export function serializeToMjml(
	state: EditorState,
	registry: BlockRegistry = defaultRegistry
): string {
	const { settings } = state;

	const head = [
		'<mj-head>',
		'  <mj-attributes>',
		`    <mj-all${attrs({ 'font-family': settings.fontFamily })} />`,
		`    <mj-text${attrs({ color: settings.textColor })} />`,
		'  </mj-attributes>',
		`  <mj-style>a { color: ${escapeXml(settings.linkColor)}; }</mj-style>`,
		...(settings.preheader ? [`  <mj-preview>${escapeXml(settings.preheader)}</mj-preview>`] : []),
		'</mj-head>'
	].join('\n');

	const bodyAttrs = attrs({
		'background-color': settings.backgroundColor,
		width: px(settings.width)
	});
	const sections = state.body.map((section) => serializeSection(section, registry)).join('\n');
	const body = sections
		? `<mj-body${bodyAttrs}>\n${indent(sections, 1)}\n</mj-body>`
		: `<mj-body${bodyAttrs}></mj-body>`;

	return `<mjml>\n${indent(head, 1)}\n${indent(body, 1)}\n</mjml>`;
}

function serializeSection(section: Section, registry: BlockRegistry): string {
	const { props } = section;
	const open = `<mj-section${attrs({
		padding: paddingValue(props.padding),
		'background-color': props.backgroundColor,
		'background-url': props.backgroundUrl
	})}>`;
	const columns = section.columns.map((column) => serializeColumn(column, registry)).join('\n');
	return columns ? `${open}\n${indent(columns, 1)}\n</mj-section>` : `${open}</mj-section>`;
}

function serializeColumn(column: Column, registry: BlockRegistry): string {
	const { props } = column;
	const open = `<mj-column${attrs({
		width: props.width,
		'vertical-align': props.verticalAlign,
		'background-color': props.backgroundColor
	})}>`;
	const blocks = column.blocks.map((block) => serializeBlock(block, registry)).join('\n');
	return blocks ? `${open}\n${indent(blocks, 1)}\n</mj-column>` : `${open}</mj-column>`;
}

function serializeBlock(block: Block, registry: BlockRegistry): string {
	const def = registry.get(block.type);
	if (!def) throw new Error(`No block definition registered for type: ${block.type}`);
	return def.toMjml(block.props);
}
