<script lang="ts">
	import { tick } from 'svelte';
	import { paddingValue } from '../../core/serializer/format.js';
	import type { TextBlockProps } from '../../core/schema/types.js';

	let { props, editable = false }: { props: TextBlockProps; editable?: boolean } = $props();

	// Inline raw-HTML editing. zag's editable machine is single-line (its input
	// part is an <input>), so multi-line HTML gets a plain auto-grown textarea:
	// dblclick to edit, Escape reverts, blur/Ctrl+Enter commits. Live oninput
	// keeps the preview pane in sync; the history debounce coalesces keystrokes.
	let editing = $state(false);
	let draftBefore = '';
	let area = $state<HTMLTextAreaElement | null>(null);

	async function startEdit() {
		if (!editable || editing) return;
		draftBefore = props.content;
		editing = true;
		await tick();
		area?.focus();
		area?.select();
	}

	function stopEdit(revert: boolean) {
		if (revert) props.content = draftBefore;
		editing = false;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			stopEdit(true);
		} else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			stopEdit(false);
		}
		e.stopPropagation();
	}
</script>

<div
	style:font-size="{props.fontSize}px"
	style:font-weight={props.fontWeight}
	style:text-align={props.align}
	style:color={props.color ?? 'inherit'}
	style:line-height={String(props.lineHeight)}
	style:padding={paddingValue(props.padding)}
	ondblclick={startEdit}
	role="presentation"
>
	{#if editing}
		<textarea
			bind:this={area}
			class="sme-text-edit"
			value={props.content}
			oninput={(e) => (props.content = e.currentTarget.value)}
			onblur={() => stopEdit(false)}
			onkeydown={onKeydown}
			onclick={(e) => e.stopPropagation()}
			aria-label="Edit text HTML"
		></textarea>
	{:else}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- user-authored inline HTML, see spec open question #2 -->
		{@html props.content}
	{/if}
</div>

<style>
	.sme-text-edit {
		width: 100%;
		min-height: 60px;
		box-sizing: border-box;
		font: 12px/1.5 ui-monospace, 'Cascadia Mono', Consolas, monospace;
		color: var(--sme-text, #0f172a);
		background: var(--sme-panel-bg, #ffffff);
		border: 1px dashed var(--sme-accent, #2563eb);
		border-radius: 4px;
		padding: 6px;
		resize: vertical;
	}
</style>
