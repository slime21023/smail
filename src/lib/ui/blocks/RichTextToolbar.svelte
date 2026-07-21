<script lang="ts">
	import { getEditorContext } from '../context.js';
	import { isValidParameterKey } from '../../core/params/params.js';

	interface Props {
		oncmd: (cmd: 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList' | 'unlink') => void;
		onblock: (tag: 'p' | 'h1' | 'h2' | 'h3') => void;
		onlink: (url: string) => void;
		oninsertparam: (key: string) => void;
		/** Save the current selection before a widget that steals focus opens. */
		onsaverange: () => void;
	}

	let { oncmd, onblock, onlink, oninsertparam, onsaverange }: Props = $props();

	const { parameters, createParameter } = getEditorContext();

	let mode = $state<'buttons' | 'link' | 'parameters'>('buttons');
	let url = $state('https://');
	let parameterQuery = $state('');
	let parameterError = $state('');

	let matchingParameters = $derived(
		parameters.filter((parameter) => {
			const query = parameterQuery.trim().toLowerCase();
			return !query || parameter.key.toLowerCase().includes(query) || parameter.label?.toLowerCase().includes(query);
		})
	);

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

	function openParameters(e: MouseEvent) {
		e.preventDefault();
		showParameters();
	}

	function showParameters() {
		onsaverange();
		parameterQuery = '';
		parameterError = '';
		mode = 'parameters';
	}

	function chooseParameter(key: string) {
		oninsertparam(key);
		mode = 'buttons';
	}

	function submitParameter() {
		const key = parameterQuery.trim();
		const existing = parameters.find((parameter) => parameter.key === key);
		if (existing) {
			chooseParameter(existing.key);
			return;
		}
		if (!isValidParameterKey(key)) {
			parameterError = 'Use letters, numbers, _, . or -.';
			return;
		}
		const created = createParameter(key);
		if (!created) {
			parameterError = 'Unable to create this parameter.';
			return;
		}
		chooseParameter(created.key);
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
		<button type="button" class="sme-rt-btn" aria-label="Underline" title="Underline (Ctrl+U)" onmousedown={guard} onclick={() => oncmd('underline')}><u>U</u></button>
		<button type="button" class="sme-rt-btn" aria-label="Bulleted list" title="Bulleted list" onmousedown={guard} onclick={() => oncmd('insertUnorderedList')}>•</button>
		<button type="button" class="sme-rt-btn" aria-label="Numbered list" title="Numbered list" onmousedown={guard} onclick={() => oncmd('insertOrderedList')}>1.</button>
		<select
			class="sme-rt-params"
			aria-label="Text style"
			onmousedown={() => onsaverange()}
			onchange={(e) => onblock(e.currentTarget.value as 'p' | 'h1' | 'h2' | 'h3')}
		>
			<option value="p">Paragraph</option>
			<option value="h1">Heading 1</option>
			<option value="h2">Heading 2</option>
			<option value="h3">Heading 3</option>
		</select>
		<button
			type="button"
			class="sme-rt-btn"
			aria-label="Insert link"
			title="Insert link"
			onmousedown={openLink}>🔗</button
		>
		<button type="button" class="sme-rt-btn" aria-label="Remove link" title="Remove link" onmousedown={guard} onclick={() => oncmd('unlink')}>↗</button>
		<button type="button" class="sme-rt-btn sme-rt-param" aria-label="Insert parameter" title="Insert parameter" onmousedown={openParameters} onclick={showParameters}>{'{ }'}</button>
	{:else}
		{#if mode === 'parameters'}
			<div class="sme-rt-parameter-picker" role="dialog" aria-label="Insert parameter">
				<input
					class="sme-rt-url"
					aria-label="Search or create parameter"
					placeholder="Search or create parameter"
					bind:value={parameterQuery}
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							submitParameter();
						} else if (e.key === 'Escape') {
							e.preventDefault();
							mode = 'buttons';
						}
						e.stopPropagation();
					}}
				/>
				<div class="sme-rt-parameter-list">
					{#each matchingParameters as parameter (parameter.key)}
						<button type="button" class="sme-rt-parameter-option" onclick={() => chooseParameter(parameter.key)}>
							<span>{parameter.label ?? parameter.key}</span><small>{parameter.key}</small>
						</button>
					{/each}
				</div>
				{#if parameterQuery.trim() && !parameters.some((parameter) => parameter.key === parameterQuery.trim())}
					<button type="button" class="sme-rt-parameter-create" onclick={submitParameter}>
						+ Add {'{{'}{parameterQuery.trim()}{'}}'}
					</button>
				{/if}
				{#if parameterError}<small class="sme-rt-parameter-error">{parameterError}</small>{/if}
				<button type="button" class="sme-rt-btn" onclick={() => (mode = 'buttons')}>Close</button>
			</div>
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
	{/if}
</div>

<style>
	.sme-richtext-toolbar {
		position: absolute;
		top: -34px;
		left: 0;
		z-index: var(--sme-popover-z, 50);
		display: flex;
		flex-wrap: wrap;
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

	.sme-rt-param { font-weight: 700; color: var(--sme-accent, #2563eb); }
	.sme-rt-parameter-picker { display: flex; flex-direction: column; gap: 5px; width: min(260px, calc(100vw - 36px)); max-width: 100%; }
	.sme-rt-parameter-picker .sme-rt-url { width: auto; }
	.sme-rt-parameter-list { display: flex; flex-direction: column; max-height: 180px; overflow-y: auto; }
	.sme-rt-parameter-option, .sme-rt-parameter-create { border: 0; border-radius: 4px; background: transparent; padding: 5px; text-align: left; color: var(--sme-text, #0f172a); font: inherit; font-size: 12px; cursor: pointer; }
	.sme-rt-parameter-option:hover, .sme-rt-parameter-create:hover { background: var(--sme-accent-soft, #dbeafe); }
	.sme-rt-parameter-option { display: flex; justify-content: space-between; gap: 12px; }
	.sme-rt-parameter-option small { color: var(--sme-text-muted, #64748b); }
	.sme-rt-parameter-create { color: var(--sme-accent, #2563eb); }
	.sme-rt-parameter-error { color: #b91c1c; font-size: 11px; }
</style>
