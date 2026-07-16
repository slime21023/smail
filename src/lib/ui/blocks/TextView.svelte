<script lang="ts">
	import { paddingValue } from '../../core/serializer/format.js';
	import type { TextBlockProps } from '../../core/schema/types.js';

	let { props }: { props: TextBlockProps } = $props();
</script>

<div
	style:font-size="{props.fontSize}px"
	style:font-weight={props.fontWeight}
	style:text-align={props.align}
	style:color={props.color ?? 'inherit'}
	style:line-height={String(props.lineHeight)}
	style:padding={paddingValue(props.padding)}
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- user-authored inline HTML, see spec open question #2 -->
	{@html props.content}
</div>
