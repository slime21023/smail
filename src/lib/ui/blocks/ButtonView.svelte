<script lang="ts">
	import { paddingValue } from '../../core/serializer/format.js';
	import type { ButtonBlockProps } from '../../core/schema/types.js';

	let { props }: { props: ButtonBlockProps } = $props();
</script>

<div style:text-align={props.align} style:padding={paddingValue(props.padding)}>
	<span
		class="sme-button-view"
		style:background-color={props.backgroundColor}
		style:color={props.color}
		style:border-radius="{props.borderRadius}px"
		style:padding={paddingValue(props.innerPadding)}
	>
		{props.text}
	</span>
</div>

<style>
	.sme-button-view {
		display: inline-block;
		font-weight: 500;
	}
</style>
