<script lang="ts">
	import type { MjmlError } from 'mjml-browser';

	interface Props {
		html: string;
		errors: MjmlError[];
		mode: 'desktop' | 'mobile';
	}

	let { html, errors, mode }: Props = $props();
</script>

<div class="sme-preview">
	{#if errors.length > 0}
		<div class="sme-preview-errors">
			{#each errors as error, i (i)}
				<p>{error.formattedMessage}</p>
			{/each}
		</div>
	{/if}
	{#if html}
		<iframe
			title="Email preview"
			srcdoc={html}
			class="sme-preview-frame"
			style:width={mode === 'mobile' ? '375px' : '100%'}
			sandbox=""
		></iframe>
	{:else}
		<div class="sme-preview-empty">Compiling preview…</div>
	{/if}
</div>

<style>
	.sme-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		box-sizing: border-box;
	}

	.sme-preview-frame {
		flex: 1;
		border: none;
		background: #ffffff;
		max-width: 100%;
	}

	.sme-preview-empty {
		padding: 48px 16px;
		color: var(--sme-text-muted, #64748b);
		font-size: 13px;
	}

	.sme-preview-errors {
		width: 100%;
		box-sizing: border-box;
		padding: 8px 12px;
		background: #fef2f2;
		color: #b91c1c;
		font-size: 12px;
		max-height: 120px;
		overflow-y: auto;
	}

	.sme-preview-errors p {
		margin: 2px 0;
	}
</style>
