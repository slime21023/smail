<script lang="ts">
	import { paddingValue } from '../../core/serializer/format.js';
	import type { DividerBlockProps } from '../../core/schema/types.js';

	let { props }: { props: DividerBlockProps } = $props();
</script>

<div style:padding={paddingValue(props.padding)}>
	<div
		style:width={props.width}
		style:margin="0 auto"
		style:border-top="{props.borderWidth}px {props.borderStyle} {props.borderColor}"
	></div>
</div>
