<script lang="ts">
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();
</script>

<textarea
	rows="4"
	aria-label={field.label}
	value={(value as string) ?? ''}
	oninput={(e) => setValue(e.currentTarget.value)}
></textarea>

<style>
	textarea {
		resize: vertical;
	}
</style>
