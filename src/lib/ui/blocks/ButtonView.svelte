<script lang="ts">
	import * as editable from '@zag-js/editable';
	import { normalizeProps, useMachine } from '@zag-js/svelte';
	import { paddingValue } from '../../core/serializer/format.js';
	import type { ButtonBlockProps } from '../../core/schema/types.js';

	let { props, editable: canEdit = false, onTextChange }: { props: ButtonBlockProps; editable?: boolean; onTextChange?: (text: string) => void } =
		$props();

	const id = $props.id();

	// Dblclick to edit; Enter/blur commits, Escape reverts (machine-internal).
	// Live changes are routed through the controller callback for history and
	// host notifications instead of mutating the block props in place.
	const service = useMachine(editable.machine, () => ({
		id,
		value: props.text,
		disabled: !canEdit,
		activationMode: 'dblclick' as const,
		onValueChange(d: editable.ValueChangeDetails) {
			if (d.value !== props.text) onTextChange?.(d.value);
		}
	}));

	const api = $derived(editable.connect(service, normalizeProps));
</script>

<div style:text-align={props.align} style:padding={paddingValue(props.padding)}>
	<span
		class="sme-button-view"
		style:background-color={props.backgroundColor}
		style:color={props.color}
		style:border-radius="{props.borderRadius}px"
		style:padding={paddingValue(props.innerPadding)}
	>
		<span {...api.getRootProps()}>
			<span {...api.getAreaProps()}>
				<span {...api.getPreviewProps()}>{props.text}</span>
				<input {...api.getInputProps()} />
			</span>
		</span>
	</span>
</div>

<style>
	.sme-button-view {
		display: inline-block;
		font-weight: 500;
	}

	.sme-button-view input {
		font: inherit;
		color: inherit;
		background: transparent;
		border: none;
		outline: 1px dashed rgba(255, 255, 255, 0.7);
		outline-offset: 2px;
		padding: 0;
	}
</style>
