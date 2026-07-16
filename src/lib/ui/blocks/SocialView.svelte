<script lang="ts">
	import { paddingValue } from '../../core/serializer/format.js';
	import type { SocialBlockProps } from '../../core/schema/types.js';

	let { props }: { props: SocialBlockProps } = $props();
</script>

<div
	class="sme-social-view"
	style:text-align={props.align}
	style:padding={paddingValue(props.padding)}
>
	{#each props.elements as element, i (i)}
		<span
			class="sme-social-badge"
			style:width="{props.iconSize}px"
			style:height="{props.iconSize}px"
			style:font-size="{Math.max(8, props.iconSize * 0.42)}px"
			style:display={props.mode === 'vertical' ? 'block' : 'inline-flex'}
			style:margin={props.mode === 'vertical' ? '4px auto' : '0 4px'}
			title={element.href}
		>
			{element.network.slice(0, 2)}
		</span>
	{/each}
</div>

<style>
	.sme-social-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: #475569;
		color: #ffffff;
		text-transform: uppercase;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>
