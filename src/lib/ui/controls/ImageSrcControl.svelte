<script lang="ts">
	import { getEditorContext } from '../context.js';
	import type { ControlProps } from './types.js';

	let { field, value, setValue }: ControlProps = $props();

	const { onImageUpload } = getEditorContext();

	let fileInput = $state<HTMLInputElement | null>(null);
	let busy = $state(false);
	let error = $state('');

	async function upload(file: File) {
		if (!onImageUpload) return;
		busy = true;
		error = '';
		try {
			setValue(await onImageUpload(file));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Upload failed';
		} finally {
			busy = false;
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<input
	type="text"
	aria-label={field.label}
	value={(value as string) ?? ''}
	oninput={(e) => setValue(e.currentTarget.value)}
/>
{#if onImageUpload}
	<div class="sme-upload-row">
		<button
			type="button"
			class="sme-upload-btn"
			disabled={busy}
			onclick={() => fileInput?.click()}
		>
			{busy ? 'Uploading…' : 'Upload'}
		</button>
		{#if error}
			<span class="sme-upload-error">{error}</span>
		{/if}
	</div>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="sme-upload-input"
		hidden
		onchange={(e) => {
			const file = e.currentTarget.files?.[0];
			if (file) upload(file);
		}}
	/>
{/if}

<style>
	.sme-upload-row {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
	}

	.sme-upload-btn {
		border: 1px dashed var(--sme-border, #e2e8f0);
		background: var(--sme-panel-bg, #ffffff);
		color: var(--sme-accent, #2563eb);
		border-radius: var(--sme-radius, 6px);
		padding: 4px 10px;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}

	.sme-upload-btn:hover:not(:disabled) {
		border-color: var(--sme-accent, #2563eb);
	}

	.sme-upload-btn:disabled {
		color: var(--sme-text-muted, #64748b);
		cursor: wait;
	}

	.sme-upload-error {
		font-size: 11px;
		color: #b91c1c;
	}
</style>
