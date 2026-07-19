import type { InspectorField } from './types.js';

/** Per-node-kind overrides for the structural inspector fields. */
export interface StructuralFields {
	section?: InspectorField[];
	column?: InspectorField[];
	settings?: InspectorField[];
}

/**
 * Default inspector fields for the structural (non-block) nodes. Override any
 * of them via the editor's `structuralFields` prop.
 */
export const sectionFields: InspectorField[] = [
	{ key: 'padding', label: 'Padding', control: 'padding' },
	{ key: 'backgroundColor', label: 'Background', control: 'color' },
	{ key: 'backgroundUrl', label: 'Background image URL', control: 'text' }
];

export const columnFields: InspectorField[] = [
	{ key: 'width', label: 'Width (e.g. 50%)', control: 'text' },
	{
		key: 'verticalAlign',
		label: 'Vertical align',
		control: 'segment',
		options: ['top', 'middle', 'bottom']
	},
	{ key: 'backgroundColor', label: 'Background', control: 'color' }
];

export const settingsFields: InspectorField[] = [
	{ key: 'width', label: 'Email width (px)', control: 'number', min: 320, max: 800 },
	{ key: 'backgroundColor', label: 'Background', control: 'color' },
	{ key: 'fontFamily', label: 'Font family', control: 'text' },
	{ key: 'textColor', label: 'Text color', control: 'color' },
	{ key: 'linkColor', label: 'Link color', control: 'color' },
	{ key: 'preheader', label: 'Preheader text', control: 'text' }
];
