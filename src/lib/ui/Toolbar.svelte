<script lang="ts">
	interface Props {
		previewMode: 'desktop' | 'mobile';
		readonly: boolean;
		canUndo: boolean;
		canRedo: boolean;
		hasParams?: boolean;
		sampleData?: boolean;
		onToggleSample?: (on: boolean) => void;
		onUndo: () => void;
		onRedo: () => void;
		onPreviewMode: (mode: 'desktop' | 'mobile') => void;
		onImportTemplate?: (file: File) => void | Promise<void>;
		onExportTemplate: () => void;
		onExportHtml: () => void;
		onExportJson: () => void;
		importError?: string;
	}

	let {
		previewMode,
		readonly,
		canUndo,
		canRedo,
		hasParams = false,
		sampleData = false,
		onToggleSample,
		onUndo,
		onRedo,
		onPreviewMode,
		onImportTemplate,
		onExportTemplate,
		onExportHtml,
		onExportJson,
		importError
	}: Props = $props();

	let fileInput = $state<HTMLInputElement>();

	async function chooseFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) await onImportTemplate?.(file);
		input.value = '';
	}
</script>

<div class="sme-toolbar">
	<span class="sme-toolbar-title">smail</span>

	<div class="sme-toolbar-group" role="group" aria-label="Preview width">
		<button
			type="button"
			class="sme-tool"
			class:sme-tool-active={previewMode === 'desktop'}
			onclick={() => onPreviewMode('desktop')}
		>
			Desktop
		</button>
		<button
			type="button"
			class="sme-tool"
			class:sme-tool-active={previewMode === 'mobile'}
			onclick={() => onPreviewMode('mobile')}
		>
			Mobile
		</button>
	</div>

	{#if hasParams}
		<button
			type="button"
			class="sme-tool"
			class:sme-tool-active={sampleData}
			aria-pressed={sampleData}
			title="Preview with sample parameter values"
			onclick={() => onToggleSample?.(!sampleData)}
		>
			Sample
		</button>
	{/if}

	<div class="sme-toolbar-spacer"></div>

	{#if !readonly}
		<button
			type="button"
			class="sme-tool"
			disabled={!canUndo}
			title="Undo (Ctrl+Z)"
			aria-label="Undo"
			onclick={onUndo}>↩</button
		>
		<button
			type="button"
			class="sme-tool"
			disabled={!canRedo}
			title="Redo (Ctrl+Y)"
			aria-label="Redo"
			onclick={onRedo}>↪</button
		>
		<input
			class="sme-file-input"
			bind:this={fileInput}
			type="file"
			accept=".smail.json,application/json"
			onchange={chooseFile}
		/>
		<button type="button" class="sme-tool" onclick={() => fileInput?.click()}>Import template</button>
	{/if}
	<button type="button" class="sme-tool" onclick={onExportTemplate}>Export template</button>
	<button type="button" class="sme-tool" onclick={onExportJson}>Export state JSON</button>
	<button type="button" class="sme-tool sme-tool-primary" onclick={onExportHtml}>
		Export HTML
	</button>
</div>

{#if importError}
	<p class="sme-import-error" role="alert">{importError}</p>
{/if}

<style>
	.sme-toolbar {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: var(--sme-panel-bg, #ffffff);
		border-bottom: 1px solid var(--sme-border, #e2e8f0);
	}

	.sme-toolbar-title {
		font-weight: 700;
		font-size: 14px;
		color: var(--sme-text, #0f172a);
		margin-right: 8px;
	}

	.sme-toolbar-group {
		display: flex;
		gap: 2px;
		background: var(--sme-bg, #f1f5f9);
		border-radius: var(--sme-radius, 6px);
		padding: 2px;
	}

	.sme-toolbar-spacer {
		flex: 1;
	}

	.sme-tool {
		border: 1px solid transparent;
		background: transparent;
		color: var(--sme-text, #0f172a);
		border-radius: var(--sme-radius, 6px);
		padding: 5px 10px;
		font: inherit;
		font-size: 13px;
		cursor: pointer;
	}

	.sme-tool:hover:not(:disabled) {
		background: var(--sme-accent-soft, #dbeafe);
	}

	.sme-tool:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.sme-tool-active {
		background: var(--sme-panel-bg, #ffffff);
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
	}

	.sme-tool-primary {
		background: var(--sme-accent, #2563eb);
		color: #ffffff;
	}

	.sme-tool-primary:hover:not(:disabled) {
		background: var(--sme-accent, #2563eb);
		opacity: 0.9;
	}

	.sme-file-input {
		display: none;
	}

	.sme-import-error {
		margin: 0;
		padding: 6px 12px;
		font-size: 12px;
		color: #b91c1c;
		background: #fef2f2;
		border-bottom: 1px solid #fecaca;
	}
</style>
