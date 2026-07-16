<script lang="ts">
	import { paddingValue } from '../../core/serializer/format.js';
	import type { ImageBlockProps } from '../../core/schema/types.js';

	let { props }: { props: ImageBlockProps } = $props();
</script>

<div style:text-align={props.align} style:padding={paddingValue(props.padding)}>
	<img
		src={props.src}
		alt={props.alt}
		style:width={props.width === undefined ? '100%' : `${props.width}px`}
		style:border-radius="{props.borderRadius}px"
		style:max-width="100%"
	/>
</div>
