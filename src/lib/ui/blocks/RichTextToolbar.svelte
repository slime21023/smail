<script lang="ts">
	import { getEditorContext } from '../context.js';

	interface Props {
		oncmd: (cmd: 'bold' | 'italic') => void;
		onlink: (url: string) => void;
		oninsertparam: (key: string) => void;
		/** Save the current selection before a widget that steals focus opens. */
		onsaverange: () => void;
	}

	let { oncmd, onlink, oninsertparam, onsaverange }: Props = $props();

	const { parameters } = getEditorContext();

	let mode = $state<'buttons' | 'link'>('buttons');
	let url = $state('https://');

	// mousedown preventDefault everywhere: keep focus/selection in the
	// contenteditable while clicking the toolbar.
	function guard(e: MouseEvent) {
		e.preventDefault();
	}

	function openLink(e: MouseEvent) {
		e.preventDefault();
		onsaverange();
		url = 'https://';
		mode = 'link';
	}

	function applyLink() {
		onlink(url);
		mode = 'buttons';
	}
</script>

<div class="sme-richtext-toolbar" role="toolbar" aria-label="Text formatting">
	{#if mode === 'buttons'}
		<button
			type="button"
			class="sme-rt-btn sme-rt-bold"
			aria-label="Bold"
			title="Bold (Ctrl+B)"
			onmousedown={guard}
			onclick={() => oncmd('bold')}><b>B</b></button
		>
		<button
			type="button"
			class="sme-rt-btn"
			aria-label="Italic"
			title="Italic (Ctrl+I)"
			onmousedown={guard}
			onclick={() => oncmd('italic')}><i>I</i></button
		>
		<button
			type="button"
			class="sme-rt-btn"
			aria-label="Insert link"
			title="Insert link"
			onmousedown={openLink}>🔗</button
		>
		{#if parameters.length > 0}
			<select
				class="sme-rt-params"
				aria-label="Insert parameter"
				onmousedown={() => onsaverange()}
				onchange={(e) => {
					const key = e.currentTarget.value;
					e.currentTarget.value = '';
					if (key) oninsertparam(key);
				}}
			>
				<option value="">{'{ } Insert…'}</option>
				{#each parameters as param (param.key)}
					<option value={param.key}>{param.label ?? param.key}</option>
				{/each}
			</select>
		{/if}
	{:else}
		<input
			type="url"
			class="sme-rt-url"
			aria-label="Link URL"
			bind:value={url}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					applyLink();
				} else if (e.key === 'Escape') {
					e.preventDefault();
					mode = 'buttons';
				}
				e.stopPropagation();
			}}
		/>
		<button type="button" class="sme-rt-btn" onmousedown={guard} onclick={applyLink}>
			Apply
		</button>
		<button
			type="button"
			class="sme-rt-btn"
			aria-label="Cancel link"
			onmousedown={guard}
			onclick={() => (mode = 'buttons')}>×</button
		>
	{/if}
</div>

<style>
	.sme-richtext-toolbar {
		position: absolute;
		top: -34px;
		left: 0;
		z-index: var(--sme-popover-z, 50);
		display: flex;
		align-items: center;
		gap: 2px;
		padding: 3px;
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: var(--sme-radius, 6px);
		box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
	}

	.sme-rt-btn {
		border: 1px solid transparent;
		background: transparent;
		color: var(--sme-text, #0f172a);
		border-radius: 4px;
		min-width: 24px;
		padding: 2px 6px;
		font: inherit;
		font-size: 12px;
		line-height: 1.5;
		cursor: pointer;
	}

	.sme-rt-btn:hover {
		background: var(--sme-accent-soft, #dbeafe);
	}

	.sme-rt-params,
	.sme-rt-url {
		font: inherit;
		font-size: 12px;
		color: var(--sme-text, #0f172a);
		background: var(--sme-panel-bg, #ffffff);
		border: 1px solid var(--sme-border, #e2e8f0);
		border-radius: 4px;
		padding: 2px 4px;
	}

	.sme-rt-url {
		width: 200px;
	}
</style>
