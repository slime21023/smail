/**
 * JSON schema for the editor state — the single source of truth.
 * MJML and HTML are both derived from this (spec §4).
 *
 * Nesting strictly mirrors MJML rules: body > section > column > leaf blocks.
 */

/** Pixel padding used by MJML-compatible blocks and sections. */
export type Padding = { top: number; right: number; bottom: number; left: number };

/** Supported horizontal alignment values. */
export type Align = 'left' | 'center' | 'right';

/** A merge-field the template uses (e.g. {{firstName}}), substituted at send time. */
export interface ParameterDef {
	key: string;
	label?: string;
	/** Value substituted in the preview when "Sample data" is on. */
	sample?: string;
}

/** Optional campaign attribution stored with a reusable template. */
export interface UTMTrackingSettings {
	enabled: boolean;
	source?: string;
	medium?: string;
	campaign?: string;
	term?: string;
	content?: string;
}

/** Provider-neutral campaign metadata. It never configures a sending provider. */
export interface TrackingSettings {
	campaignId?: string;
	utm: UTMTrackingSettings;
}

export interface DocumentSettings {
	/** Human-readable name used when this document is saved as a template. */
	templateName: string;
	/** Default email subject. Sending applications may override it. */
	subject: string;
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
	/** Declared merge-fields; makes exported templates self-describing. Never serialized to MJML. */
	parameters?: ParameterDef[];
	/** Campaign and provider defaults. Never serialized to MJML. */
	tracking: TrackingSettings;
}

/** Complete editable document. MJML and HTML are derived, never persisted as the source of truth. */
export interface EditorState {
	/** Schema version, for future migrations. */
	version: string;
	settings: DocumentSettings;
	body: Section[];
}

/** Visual attributes emitted on an `mj-section`. */
export interface SectionProps {
	padding: Padding;
	backgroundColor?: string;
	backgroundUrl?: string;
}

/** A layout row containing one to four columns. */
export interface Section {
	id: string;
	type: 'section';
	props: SectionProps;
	columns: Column[];
}

export interface ColumnProps {
	/** Percentage string. It is normalized to 5% steps totaling 100% per section. */
	width?: string;
	verticalAlign: 'top' | 'middle' | 'bottom';
	backgroundColor?: string;
}

/** A vertical container for leaf blocks. */
export interface Column {
	id: string;
	type: 'column';
	props: ColumnProps;
	blocks: Block[];
}

export interface TextBlockProps {
	/** Sanitized email-focused rich-text HTML; raw arbitrary HTML is not supported. */
	content: string;
	fontSize: number;
	fontWeight: 'normal' | 'bold';
	align: Align;
	/** Omit to inherit the global text color. */
	color?: string;
	lineHeight: number;
	padding: Padding;
}

/** Props for an image; src and href are filtered by the built-in URL policy at serialization. */
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

/** Props for a call-to-action button; href is filtered at serialization. */
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

export const SOCIAL_NETWORKS = [
	'facebook',
	'x',
	'instagram',
	'linkedin',
	'youtube',
	'github',
	'web'
] as const;

export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

/** One social icon and its destination URL. */
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
