import ColorControl from './ColorControl.svelte';
import NumberControl from './NumberControl.svelte';
import PaddingControl from './PaddingControl.svelte';
import SegmentControl from './SegmentControl.svelte';
import SelectControl from './SelectControl.svelte';
import TextControl from './TextControl.svelte';
import TextareaControl from './TextareaControl.svelte';
import type { ControlRegistry } from './types.js';

export const builtinControls: ControlRegistry = {
	text: TextControl,
	textarea: TextareaControl,
	number: NumberControl,
	color: ColorControl,
	select: SelectControl,
	segment: SegmentControl,
	padding: PaddingControl
};
