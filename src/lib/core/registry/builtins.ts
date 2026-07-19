import { attrs, escapeXml, paddingValue, px } from '../serializer/format.js';
import type {
	ButtonBlockProps,
	DividerBlockProps,
	ImageBlockProps,
	SocialBlockProps,
	SpacerBlockProps,
	TextBlockProps
} from '../schema/types.js';
import { defineBlock } from './types.js';

const zeroPadding = { top: 0, right: 0, bottom: 0, left: 0 };
const defaultPadding = { top: 10, right: 25, bottom: 10, left: 25 };

export const textBlock = defineBlock<TextBlockProps>({
	type: 'text',
	label: 'Text',
	defaultProps: {
		content: 'Write something…',
		fontSize: 14,
		fontWeight: 'normal',
		align: 'left',
		lineHeight: 1.5,
		padding: { ...defaultPadding }
	},
	inspector: [
		{ key: 'content', label: 'Content', control: 'textarea' },
		{ key: 'fontSize', label: 'Font size', control: 'number', min: 8, max: 72 },
		{ key: 'fontWeight', label: 'Weight', control: 'segment', options: ['normal', 'bold'] },
		{ key: 'align', label: 'Align', control: 'segment', options: ['left', 'center', 'right'] },
		{ key: 'color', label: 'Color', control: 'color' },
		{ key: 'lineHeight', label: 'Line height', control: 'number', min: 1, max: 3, step: 0.1 },
		{ key: 'padding', label: 'Padding', control: 'padding' }
	],
	// content is user-authored inline HTML and is passed through unescaped
	toMjml: (p) =>
		`<mj-text${attrs({
			'font-size': px(p.fontSize),
			'font-weight': p.fontWeight === 'bold' ? 'bold' : undefined,
			align: p.align,
			color: p.color,
			'line-height': p.lineHeight,
			padding: paddingValue(p.padding)
		})}>${p.content}</mj-text>`
});

export const imageBlock = defineBlock<ImageBlockProps>({
	type: 'image',
	label: 'Image',
	defaultProps: {
		src: 'https://placehold.co/600x300/e2e8f0/64748b?text=Image',
		alt: '',
		align: 'center',
		borderRadius: 0,
		padding: { ...defaultPadding }
	},
	inspector: [
		{ key: 'src', label: 'Image URL', control: 'imageSrc' },
		{ key: 'alt', label: 'Alt text', control: 'text' },
		{ key: 'width', label: 'Width (px)', control: 'number', min: 20, max: 600 },
		{ key: 'href', label: 'Link URL', control: 'text' },
		{ key: 'align', label: 'Align', control: 'segment', options: ['left', 'center', 'right'] },
		{ key: 'borderRadius', label: 'Corner radius', control: 'number', min: 0, max: 100 },
		{ key: 'padding', label: 'Padding', control: 'padding' }
	],
	toMjml: (p) =>
		`<mj-image${attrs({
			src: p.src,
			alt: p.alt,
			width: p.width === undefined ? undefined : px(p.width),
			href: p.href,
			align: p.align,
			'border-radius': p.borderRadius > 0 ? px(p.borderRadius) : undefined,
			padding: paddingValue(p.padding)
		})} />`
});

export const buttonBlock = defineBlock<ButtonBlockProps>({
	type: 'button',
	label: 'Button',
	defaultProps: {
		text: 'Click me',
		href: 'https://example.com',
		backgroundColor: '#2563eb',
		color: '#ffffff',
		borderRadius: 4,
		align: 'center',
		padding: { ...defaultPadding },
		innerPadding: { top: 10, right: 25, bottom: 10, left: 25 }
	},
	inspector: [
		{ key: 'text', label: 'Label', control: 'text' },
		{ key: 'href', label: 'Link URL', control: 'text' },
		{ key: 'backgroundColor', label: 'Background', control: 'color' },
		{ key: 'color', label: 'Text color', control: 'color' },
		{ key: 'borderRadius', label: 'Corner radius', control: 'number', min: 0, max: 100 },
		{ key: 'align', label: 'Align', control: 'segment', options: ['left', 'center', 'right'] },
		{ key: 'padding', label: 'Padding', control: 'padding' },
		{ key: 'innerPadding', label: 'Inner padding', control: 'padding' }
	],
	toMjml: (p) =>
		`<mj-button${attrs({
			href: p.href,
			'background-color': p.backgroundColor,
			color: p.color,
			'border-radius': px(p.borderRadius),
			align: p.align,
			padding: paddingValue(p.padding),
			'inner-padding': paddingValue(p.innerPadding)
		})}>${escapeXml(p.text)}</mj-button>`
});

export const dividerBlock = defineBlock<DividerBlockProps>({
	type: 'divider',
	label: 'Divider',
	defaultProps: {
		borderColor: '#e2e8f0',
		borderWidth: 1,
		borderStyle: 'solid',
		width: '100%',
		padding: { ...defaultPadding }
	},
	inspector: [
		{ key: 'borderColor', label: 'Color', control: 'color' },
		{ key: 'borderWidth', label: 'Thickness', control: 'number', min: 1, max: 10 },
		{ key: 'borderStyle', label: 'Style', control: 'select', options: ['solid', 'dashed', 'dotted'] },
		{ key: 'width', label: 'Width', control: 'text' },
		{ key: 'padding', label: 'Padding', control: 'padding' }
	],
	toMjml: (p) =>
		`<mj-divider${attrs({
			'border-color': p.borderColor,
			'border-width': px(p.borderWidth),
			'border-style': p.borderStyle,
			width: p.width,
			padding: paddingValue(p.padding)
		})} />`
});

export const spacerBlock = defineBlock<SpacerBlockProps>({
	type: 'spacer',
	label: 'Spacer',
	defaultProps: { height: 20 },
	inspector: [{ key: 'height', label: 'Height (px)', control: 'number', min: 4, max: 200 }],
	toMjml: (p) => `<mj-spacer${attrs({ height: px(p.height) })} />`
});

export const socialBlock = defineBlock<SocialBlockProps>({
	type: 'social',
	label: 'Social',
	defaultProps: {
		elements: [
			{ network: 'facebook', href: 'https://facebook.com' },
			{ network: 'x', href: 'https://x.com' },
			{ network: 'instagram', href: 'https://instagram.com' }
		],
		align: 'center',
		iconSize: 24,
		mode: 'horizontal',
		padding: { ...defaultPadding }
	},
	inspector: [
		{ key: 'elements', label: 'Links', control: 'socialLinks' },
		{ key: 'align', label: 'Align', control: 'segment', options: ['left', 'center', 'right'] },
		{ key: 'iconSize', label: 'Icon size', control: 'number', min: 12, max: 64 },
		{ key: 'mode', label: 'Layout', control: 'segment', options: ['horizontal', 'vertical'] }
	],
	toMjml: (p) => {
		// -noshare: link the href directly ("follow us"); the bare network names
		// wrap it in the platform's share-intent URL, which is never what an EDM
		// social row wants.
		const elements = p.elements
			.map(
				(el) =>
					`  <mj-social-element${attrs({ name: `${el.network}-noshare`, href: el.href })} />`
			)
			.join('\n');
		const open = `<mj-social${attrs({
			align: p.align,
			'icon-size': px(p.iconSize),
			mode: p.mode,
			padding: paddingValue(p.padding)
		})}>`;
		return p.elements.length === 0
			? `${open}</mj-social>`
			: `${open}\n${elements}\n</mj-social>`;
	}
});

export const builtinBlocks = [
	textBlock,
	imageBlock,
	buttonBlock,
	dividerBlock,
	spacerBlock,
	socialBlock
];
