<script lang="ts">
	import type { SpacerBlockProps } from '../../core/schema/types.js';

	let { props }: { props: SpacerBlockProps } = $props();
</script>

<div class="sme-spacer-view" style:height="{props.height}px"></div>

<style>
	.sme-spacer-view {
		background: repeating-linear-gradient(
			45deg,
			transparent,
			transparent 6px,
			rgba(100, 116, 139, 0.08) 6px,
			rgba(100, 116, 139, 0.08) 12px
		);
	}
</style>
