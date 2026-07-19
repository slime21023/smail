<script lang="ts">
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();
</script>

<input
	type="text"
	aria-label={field.label}
	value={(value as string) ?? ''}
	oninput={(e) => setValue(e.currentTarget.value)}
/>
