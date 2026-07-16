/**
 * JSON schema for the editor state — the single source of truth.
 * MJML and HTML are both derived from this (spec §4).
 *
 * Nesting strictly mirrors MJML rules: body > section > column > leaf blocks.
 */

export type Padding = { top: number; right: number; bottom: number; left: number };

export type Align = 'left' | 'center' | 'right';

export interface DocumentSettings {
	/** Email content width in px (default 600). */
	width: number;
	/** mj-body background-color. */
	backgroundColor: string;
	/** Global default font family (mj-all). */
	fontFamily: string;
	/** Global default text color (mj-text). */
	textColor: string;
	/** Link color, emitted as a head style. */
	linkColor: string;
	/** Preview text (mj-preview). */
	preheader?: string;
}

export interface EditorState {
	/** Schema version, for future migrations. */
	version: string;
	settings: DocumentSettings;
	body: Section[];
}

export interface SectionProps {
	padding: Padding;
	backgroundColor?: string;
	backgroundUrl?: string;
}

export interface Section {
	id: string;
	type: 'section';
	props: SectionProps;
	columns: Column[];
}

export interface ColumnProps {
	/** CSS width like '50%'. Omit to let MJML split evenly. */
	width?: string;
	verticalAlign: 'top' | 'middle' | 'bottom';
	backgroundColor?: string;
}

export interface Column {
	id: string;
	type: 'column';
	props: ColumnProps;
	blocks: Block[];
}

export interface TextBlockProps {
	/** Limited inline HTML allowed (sanitization strategy: spec open question #2). */
	content: string;
	fontSize: number;
	fontWeight: 'normal' | 'bold';
	align: Align;
	/** Omit to inherit the global text color. */
	color?: string;
	lineHeight: number;
	padding: Padding;
}

export interface ImageBlockProps {
	src: string;
	alt: string;
	/** Rendered width in px. Omit for full column width. */
	width?: number;
	href?: string;
	align: Align;
	borderRadius: number;
	padding: Padding;
}

export interface ButtonBlockProps {
	text: string;
	href: string;
	backgroundColor: string;
	color: string;
	borderRadius: number;
	align: Align;
	padding: Padding;
	innerPadding: Padding;
}

export interface DividerBlockProps {
	borderColor: string;
	borderWidth: number;
	borderStyle: 'solid' | 'dashed' | 'dotted';
	/** CSS width like '100%'. */
	width: string;
	padding: Padding;
}

export interface SpacerBlockProps {
	height: number;
}

export type SocialNetwork =
	| 'facebook'
	| 'x'
	| 'instagram'
	| 'linkedin'
	| 'youtube'
	| 'github'
	| 'web';

export interface SocialElement {
	network: SocialNetwork;
	href: string;
}

export interface SocialBlockProps {
	elements: SocialElement[];
	align: Align;
	iconSize: number;
	mode: 'horizontal' | 'vertical';
	padding: Padding;
}

interface BlockBase<T extends string, P> {
	id: string;
	type: T;
	props: P;
}

export type TextBlock = BlockBase<'text', TextBlockProps>;
export type ImageBlock = BlockBase<'image', ImageBlockProps>;
export type ButtonBlock = BlockBase<'button', ButtonBlockProps>;
export type DividerBlock = BlockBase<'divider', DividerBlockProps>;
export type SpacerBlock = BlockBase<'spacer', SpacerBlockProps>;
export type SocialBlock = BlockBase<'social', SocialBlockProps>;

export type Block = TextBlock | ImageBlock | ButtonBlock | DividerBlock | SpacerBlock | SocialBlock;

export type BlockType = Block['type'];
